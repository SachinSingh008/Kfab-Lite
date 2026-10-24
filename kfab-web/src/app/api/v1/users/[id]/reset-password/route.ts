import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { newPassword, forcePasswordReset, revokeExistingSessions } = body;

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { statusCode: 500, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing on server.' },
        { status: 500 }
      );
    }

    // Resolve target Supabase Auth user ID (support UUID, email, or username)
    let targetAuthId = id;
    const { data: userCheck, error: userCheckErr } = await admin.auth.admin.getUserById(id);
    if (userCheckErr || !userCheck?.user) {
      const { data: listData } = await admin.auth.admin.listUsers();
      const matched = listData?.users.find(
        (u) =>
          u.id === id ||
          u.email?.toLowerCase() === id.toLowerCase() ||
          (u.user_metadata?.username && u.user_metadata.username.toLowerCase() === id.toLowerCase())
      );
      if (matched) {
        targetAuthId = matched.id;
      }
    }

    // Enforce role permission:
    // Admin can edit password of himself, all supervisors, and all accountants. Cannot edit other admins or super admin.
    const callerRole = request.headers.get('x-caller-role') || body.callerRole || '';
    const callerId = request.headers.get('x-caller-id') || body.callerId || '';

    if (callerRole === 'ADMIN') {
      const { data: targetProfile } = await admin
        .from('profiles')
        .select('id, role')
        .or(`id.eq.${targetAuthId},id.eq.${id}`)
        .maybeSingle();

      if (targetProfile) {
        const isSelf = callerId && (callerId === targetProfile.id);
        const isSupervisorOrAcc =
          targetProfile.role === 'SUPERVISOR' ||
          targetProfile.role === 'ACCOUNTANT' ||
          targetProfile.role === 'ACCOUNT';

        if (!isSelf && !isSupervisorOrAcc) {
          return NextResponse.json(
            { statusCode: 403, message: 'Permission denied: Admins can only change passwords of themselves, supervisors, and accountants.' },
            { status: 403 }
          );
        }
      }
    }

    // 1. Authoritative password update in Supabase Auth
    if (newPassword !== undefined && newPassword !== null) {
      const pwd = String(newPassword).trim();
      if (pwd.length < 6) {
        return NextResponse.json(
          { statusCode: 400, message: 'Password must be at least 6 characters in Supabase.' },
          { status: 400 }
        );
      }

      const { error: authError } = await admin.auth.admin.updateUserById(targetAuthId, {
        password: pwd,
      });

      if (authError) {
        console.error('[api/v1/users/reset-password] Auth admin update error:', authError);
        return NextResponse.json(
          { statusCode: 400, message: `Password update failed: ${authError.message}` },
          { status: 400 }
        );
      }
    }

    // 2. Update profile metadata
    try {
      await admin
        .from('profiles')
        .update({
          force_password_reset: forcePasswordReset ?? false,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${targetAuthId},id.eq.${id}`);
    } catch {
      // Non-blocking if profiles table has RLS or specific schema
    }

    // 3. Revoke sessions if requested
    if (revokeExistingSessions) {
      try {
        await admin.auth.admin.signOut(targetAuthId);
      } catch {
        // ignore if no active session
      }
    }

    return NextResponse.json({
      statusCode: 200,
      message: newPassword
        ? 'Password successfully updated in Supabase directory.'
        : 'Password reset request processed.',
    });
  } catch (err: unknown) {
    console.error('[api/v1/users/reset-password] Uncaught error:', err);
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
