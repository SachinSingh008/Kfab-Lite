import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(
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

    if (id === '6060b3df-fec0-4772-8d3a-d32d3efd97d5') {
      return NextResponse.json(
        { statusCode: 403, message: 'Primary Super Administrator account cannot be deactivated.' },
        { status: 403 }
      );
    }

    const { data: targetProfile } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .maybeSingle();

    if (targetProfile?.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { statusCode: 403, message: 'Super Administrator accounts cannot be deactivated.' },
        { status: 403 }
      );
    }

    const callerRole = request.headers.get('x-caller-role') || '';
    const callerId = request.headers.get('x-caller-id') || '';

    if (callerRole === 'ADMIN') {
      const isSupervisorOrAcc =
        targetProfile?.role === 'SUPERVISOR' ||
        targetProfile?.role === 'ACCOUNTANT' ||
        targetProfile?.role === 'ACCOUNT';

      if (!isSupervisorOrAcc || (callerId && callerId === id)) {
        return NextResponse.json(
          { statusCode: 403, message: 'Permission denied: Admins can only deactivate supervisors and accountants.' },
          { status: 403 }
        );
      }
    }

    const { data: updated, error } = await admin
      .from('profiles')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { statusCode: 400, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      statusCode: 200,
      message: 'User deactivated successfully in Supabase.',
      user: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { statusCode: 500, message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
