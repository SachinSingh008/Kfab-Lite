import { NextResponse } from 'next/server';

export async function GET() {
  const roles = [
    {
      id: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Unrestricted plant-wide access, user creation, financial audits, security overrides',
      userCount: 1,
    },
    {
      id: 'ADMIN',
      name: 'Plant Admin',
      description: 'Full operational control, shift planning, daily reports, machine telemetry',
      userCount: 2,
    },
    {
      id: 'SUPERVISOR',
      name: 'Site Supervisor',
      description: 'Bay oversight, daily reports DPR, worker muster, machine checklist',
      userCount: 1,
    },
    {
      id: 'ACCOUNTANT',
      name: 'Accountant',
      description: 'Ledger management, billing reconciliations, vendor challans, payroll',
      userCount: 0,
    },
  ];

  return NextResponse.json({ statusCode: 200, roles });
}
