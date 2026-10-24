import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ logs: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { data: auditLogs, error } = await admin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[GET /api/v1/logs] Audit logs error:', error);
      return NextResponse.json({ logs: [], total: 0 });
    }

    const logs = (auditLogs || []).map((l: any) => ({
      id: l.id,
      created_at: l.created_at,
      action: l.action || 'SECURITY_EVENT',
      module: 'USERS_SECURITY',
      actor_id: l.actor_id,
      target_user_id: l.target_user_id,
      details: l.details || {},
      status: l.status || 'SUCCESS',
      ip_address: l.ip_address || '127.0.0.1',
    }));

    return NextResponse.json({
      statusCode: 200,
      logs,
      total: logs.length,
    });
  } catch (err: unknown) {
    console.error('[GET /api/v1/logs] Uncaught error:', err);
    return NextResponse.json({ logs: [], total: 0 });
  }
}
