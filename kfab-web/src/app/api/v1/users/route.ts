import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { statusCode: 500, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const role = searchParams.get('role') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    // Query profiles directly from Supabase
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/v1/users] Supabase profiles query error:', error);
      return NextResponse.json(
        { statusCode: 500, message: `Supabase query error: ${error.message}` },
        { status: 500 }
      );
    }

    // Authoritative user accounts in the database (auth.users)
    const { data: authData, error: authError } = await admin.auth.admin.listUsers();
    if (authError || !authData?.users) {
      console.error('[GET /api/v1/users] Supabase auth listUsers error:', authError);
      return NextResponse.json(
        { statusCode: 500, message: `Database error: ${authError?.message || 'Failed to list auth users'}` },
        { status: 500 }
      );
    }

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const profileEmailMap = new Map((profiles || []).map((p: any) => [p.email?.toLowerCase(), p]));

    // Authoritative accounts sourced strictly from the database (auth.users)
    let users = authData.users.map((authUser) => {
      const p = profileMap.get(authUser.id) || (authUser.email ? profileEmailMap.get(authUser.email.toLowerCase()) : undefined);
      const userMeta = authUser.user_metadata || {};

      let role = p?.role || userMeta.role || 'VIEWER';
      if (role === 'ACCOUNT') role = 'ACCOUNTANT';
      const isSuper =
        role === 'SUPER_ADMIN' ||
        userMeta.is_super_admin === true ||
        authUser.email?.toLowerCase() === 'sachinasinghofficial@gmail.com';
      if (isSuper) role = 'SUPER_ADMIN';

      return {
        id: authUser.id,
        fullName: p?.full_name || userMeta.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || p?.email || '',
        username: authUser.email || p?.email || '',
        role,
        status: p?.status || (authUser.banned_until ? 'INACTIVE' : 'ACTIVE'),
        department: null,
        designation: null,
        employeeId: null,
        forcePasswordReset: p?.force_password_reset ?? false,
        isSuperAdmin: isSuper,
        lastLoginAt: authUser.last_sign_in_at || p?.last_login_at || null,
        sessionRevokedAt: p?.session_revoked_at || null,
        createdAt: authUser.created_at || p?.created_at || new Date().toISOString(),
        updatedAt: p?.updated_at || authUser.updated_at || new Date().toISOString(),
      };
    });

    if (search) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
      );
    }

    if (role !== 'ALL') {
      users = users.filter((u) => u.role === role);
    }

    if (status !== 'ALL') {
      users = users.filter((u) => u.status === status);
    }

    const total = users.length;
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);

    return NextResponse.json({
      statusCode: 200,
      users: paginatedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: unknown) {
    console.error('[GET /api/v1/users] Uncaught error:', err);
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { statusCode: 500, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing.' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { fullName, email, role, status } = body;
    // Accept either 'password' or 'initialPassword' from the client
    const password = body.password || body.initialPassword;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { statusCode: 400, message: 'Full name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    // 1. Create authoritative user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (authError || !authData.user) {
      console.error('[POST /api/v1/users] Supabase auth.admin.createUser error:', authError);
      return NextResponse.json(
        { statusCode: 400, message: authError?.message || 'Failed to create user in Supabase Auth' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert or update in profiles table
    const profilePayload = {
      id: userId,
      full_name: fullName,
      email,
      role,
      status: status || 'ACTIVE',
      force_password_reset: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await admin
      .from('profiles')
      .upsert(profilePayload);

    if (profileError) {
      console.warn('[POST /api/v1/users] Profiles upsert error:', profileError);
    }

    // 3. Log into audit_logs
    try {
      await admin.from('audit_logs').insert({
        action: 'USER_CREATE',
        target_user_id: userId,
        status: 'SUCCESS',
        details: { fullName, email, role },
        created_at: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      statusCode: 201,
      message: 'User created successfully in Supabase.',
      user: {
        id: userId,
        fullName,
        email,
        username: email,
        role,
        status: status || 'ACTIVE',
        department: null,
        designation: null,
        employeeId: null,
        forcePasswordReset: false,
        isSuperAdmin: role === 'SUPER_ADMIN',
        lastLoginAt: null,
        sessionRevokedAt: null,
        createdAt: profilePayload.created_at,
        updatedAt: profilePayload.updated_at,
      },
    }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/v1/users] Uncaught error:', err);
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
