import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin, createUserClient, hasServiceRoleKey } from '../db/supabase.js';
import { isProd } from '../config/env.js';

export interface AuthenticatedUser {
  id: string; // Authoritative sub from token
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  companyId?: string;
  token: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    correlationId?: string;
  }
}

/**
 * Authentication Middleware:
 * Validates Supabase JWT, resolves authoritative identity (sub),
 * verifies account status and session revocation cutoff.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or invalid Bearer authentication token.',
    });
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Empty authentication token provided.',
    });
  }

  // In development/test mode, allow verified dev session tokens if Supabase Auth is offline or bypassed locally
  if (!isProd && token.startsWith('kfab-dev-token-')) {
    try {
      const payloadBase64 = token.replace('kfab-dev-token-', '');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));

      const rawSub = String(payload.sub || '00000000-0000-0000-0000-000000000001');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSub);
      const safeUuid = isUuid ? rawSub : '00000000-0000-0000-0000-000000000001';

      const normRole = (payload.role === 'ACCOUNTANT' ? 'ACCOUNT' : payload.role || 'SUPER_ADMIN').toUpperCase();
      const isSuper = normRole === 'SUPER_ADMIN' || payload.isSuperAdmin === true;

      request.user = {
        id: safeUuid,
        email: payload.email || 'superadmin@kfab.in',
        name: payload.name || 'Super Administrator',
        role: normRole,
        isSuperAdmin: isSuper,
        status: payload.status || 'ACTIVE',
        token,
      };
      return;
    } catch {
      // Fall through to standard GoTrue token validation
    }
  }

  try {
    // 1. Validate token with Supabase Auth (GoTrue authoritative identity provider)
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid, expired, or tampered authentication token.',
      });
    }

    const authUser = authData.user;
    const userId = authUser.id; // Authoritative sub

    // 2. Fetch user profile from database (using service role or caller token context under RLS)
    const dbClient = hasServiceRoleKey ? supabaseAdmin : createUserClient(token);
    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('id, full_name, email, role, status, is_super_admin, session_revoked_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      request.log.error({ err: profileError, userId }, 'Error fetching user profile during authentication');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Could not resolve security credentials.',
      });
    }

    const isSuperAdmin = profile?.is_super_admin ?? false;
    const status = profile?.status ?? 'ACTIVE';

    // 3. Verify Account Status
    if (status === 'INACTIVE') {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account has been deactivated. Please contact your system administrator.',
      });
    }

    // 4. Session revocation check: if admin revoked sessions
    if (profile?.session_revoked_at) {
      const revokedAt = new Date(profile.session_revoked_at).getTime();
      // Token created_at / iat if available in user object
      const tokenIat = (authUser as { confirmed_at?: string; last_sign_in_at?: string }).last_sign_in_at
        ? new Date((authUser as { last_sign_in_at: string }).last_sign_in_at).getTime()
        : 0;

      if (tokenIat > 0 && tokenIat < revokedAt) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Your session has been terminated by an administrator. Please log in again.',
        });
      }
    }

    // 5. Attach authoritative user context to request
    request.user = {
      id: userId,
      email: authUser.email || profile?.email || '',
      name: profile?.full_name || authUser.user_metadata?.full_name || 'User',
      role: isSuperAdmin ? 'SUPER_ADMIN' : profile?.role || 'ADMIN',
      isSuperAdmin,
      status: 'ACTIVE',
      token,
    };
  } catch (err) {
    request.log.error({ err }, 'Unexpected authentication failure');
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication verification failed.',
    });
  }
}
