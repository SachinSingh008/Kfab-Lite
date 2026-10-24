import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { statusCode: 500, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing.' },
        { status: 500 }
      );
    }

    // Query user profile
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { statusCode: 404, message: 'User not found in Supabase directory.' },
        { status: 404 }
      );
    }

    // Query user audit logs
    const { data: auditLogs } = await admin
      .from('audit_logs')
      .select('*')
      .eq('target_user_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    const user = {
      id: profile.id,
      fullName: profile.full_name || 'User',
      email: profile.email,
      username: profile.email,
      role: profile.role,
      status: profile.status || 'ACTIVE',
      department: null,
      designation: null,
      employeeId: null,
      forcePasswordReset: profile.force_password_reset ?? false,
      isSuperAdmin: profile.role === 'SUPER_ADMIN',
      lastLoginAt: profile.last_login_at,
      sessionRevokedAt: profile.session_revoked_at,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      auditLogs: auditLogs || [],
    };

    return NextResponse.json({ statusCode: 200, user });
  } catch (err: unknown) {
    console.error('[GET /api/v1/users/:id] Uncaught error:', err);
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { statusCode: 500, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing.' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { fullName, email, role, status } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (fullName) updates.full_name = fullName;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (status) updates.status = status;

    // 1. Update Supabase profiles table
    const { data: updated, error: profileErr } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (profileErr) {
      console.error('[PUT /api/v1/users/:id] Profile update error:', profileErr);
    }

    // 2. Update Supabase Auth user metadata
    try {
      const authUpdates: Record<string, any> = {};
      if (email) authUpdates.email = email;
      if (fullName || role) {
        authUpdates.user_metadata = {};
        if (fullName) authUpdates.user_metadata.full_name = fullName;
        if (role) authUpdates.user_metadata.role = role;
      }
      if (Object.keys(authUpdates).length > 0) {
        await admin.auth.admin.updateUserById(id, authUpdates);
      }
    } catch (authErr) {
      console.warn('[PUT /api/v1/users/:id] Auth admin metadata update warning:', authErr);
    }

    return NextResponse.json({
      statusCode: 200,
      message: 'User updated successfully.',
      user: updated || { id, ...updates },
    });
  } catch (err: unknown) {
    console.error('[PUT /api/v1/users/:id] Uncaught error:', err);
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { statusCode: 500, message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY missing.' },
        { status: 500 }
      );
    }

    // 1. Delete from profiles
    await admin.from('profiles').delete().eq('id', id);

    // 2. Delete from Supabase Auth
    try {
      await admin.auth.admin.deleteUser(id);
    } catch (authErr) {
      console.warn('[DELETE /api/v1/users/:id] Auth delete warning:', authErr);
    }

    // 3. Log audit action
    try {
      await admin.from('audit_logs').insert({
        action: 'USER_DELETE',
        target_user_id: id,
        status: 'SUCCESS',
        created_at: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      statusCode: 200,
      message: 'User deleted successfully from Supabase.',
      deletedId: id,
    });
  } catch (err: unknown) {
    console.error('[DELETE /api/v1/users/:id] Uncaught error:', err);
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
