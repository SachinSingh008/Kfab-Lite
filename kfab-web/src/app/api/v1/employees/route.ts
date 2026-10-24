import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ employees: [] });
    }

    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[GET /api/v1/employees] Profiles query error:', error);
      return NextResponse.json({ employees: [] });
    }

    const employees = (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Employee',
      email: p.email,
      role: p.role,
      status: p.status || 'ACTIVE',
      department: p.role === 'SUPERVISOR' ? 'Fabrication & Bays' : p.role === 'ACCOUNTANT' ? 'Accounts & Finance' : 'Executive Management',
      designation: p.role?.replace('_', ' '),
      phone: null,
      shift: 'Shift A',
      joiningDate: p.created_at?.slice(0, 10) || '2026-01-01',
    }));

    return NextResponse.json({ statusCode: 200, employees });
  } catch (err: unknown) {
    console.error('[GET /api/v1/employees] Uncaught error:', err);
    return NextResponse.json({ employees: [] });
  }
}
