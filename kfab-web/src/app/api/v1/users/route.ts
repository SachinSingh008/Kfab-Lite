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

    let users = (profiles || []).map((p: any) => ({
      id: p.id,
      fullName: p.full_name || 'User',
      email: p.email,
      username: p.email,
      role: p.role,
      status: p.status || 'ACTIVE',
      department: null,
      designation: null,
      employeeId: null,
      forcePasswordReset: p.force_password_reset ?? false,
      isSuperAdmin: p.role === 'SUPER_ADMIN',
      lastLoginAt: p.last_login_at,
      sessionRevokedAt: p.session_revoked_at,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
    }));

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
    const { fullName, email, password, role, status } = body;

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
        ...profilePayload,
        username: email,
        isSuperAdmin: role === 'SUPER_ADMIN',
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
