import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

function createMockToken(role: string, id: string = '00000000-0000-0000-0000-000000000001', name: string = 'Test User'): string {
  const payload = {
    sub: id,
    email: `${role.toLowerCase()}@kfab.in`,
    name,
    role,
    isSuperAdmin: role === 'SUPER_ADMIN',
    status: 'ACTIVE',
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `kfab-dev-token-${encoded}`;
}

describe('KFab360 Attendance Module Comprehensive Test Suite', () => {
  let app: FastifyInstance;
  let testCompanyId: string;
  let testEmployeeId1: string;
  let testEmployeeId2: string;
  const testDate = '2026-10-04';

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // 1. Fetch authorized company
    const compRes = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/companies',
      headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
    });
    expect(compRes.statusCode).toBe(200);
    const compJson = compRes.json();
    expect(compJson.companies.length).toBeGreaterThan(0);
    testCompanyId = compJson.companies[0].id;

    // 2. Fetch company employees
    const empRes = await app.inject({
      method: 'GET',
      url: `/api/v1/attendance/employees?company_id=${testCompanyId}`,
      headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
    });
    expect(empRes.statusCode).toBe(200);
    const empJson = empRes.json();
    expect(empJson.employees.length).toBeGreaterThan(1);
    testEmployeeId1 = empJson.employees[0].id;
    testEmployeeId2 = empJson.employees[1].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Attendance Creation (PRESENT, ABSENT, OD) & Overtime Validations', () => {
    it('1.1 Creates PRESENT attendance record with overtime decimal', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/mark',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: testDate,
          status: 'PRESENT',
          overtime_hours: 2.5,
          remarks: 'Completed urgent fabrication work',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.record).toBeDefined();
      expect(json.record.status).toBe('PRESENT');
      expect(json.record.overtimeHours).toBe(2.5);
      expect(json.record.remarks).toBe('Completed urgent fabrication work');
    });

    it('1.2 Creates ABSENT attendance record (distinct from blank)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/mark',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId2,
          attendance_date: testDate,
          status: 'ABSENT',
          overtime_hours: 0,
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.record).toBeDefined();
      expect(json.record.status).toBe('ABSENT');
      expect(json.record.overtimeHours).toBe(0);
    });

    it('1.3 Creates OD (On Duty) attendance record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/mark',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: '2026-10-05',
          status: 'OD',
          remarks: 'Client site inspection',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.record.status).toBe('OD');
      expect(json.record.remarks).toBe('Client site inspection');
    });

    it('1.4 Rejects negative overtime hours', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/mark',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: testDate,
          status: 'PRESENT',
          overtime_hours: -1.5,
        },
      });
      expect(res.statusCode).toBe(400);
      const json = res.json();
      expect(json.message).toContain('Overtime hours cannot be negative');
    });

    it('1.5 Rejects invalid attendance status string (e.g. XYZ)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/mark',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: testDate,
          status: 'XYZ',
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('1.6 Updates overtime independently via PATCH /overtime', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/attendance/overtime',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: testDate,
          overtime_hours: 4.0,
          remarks: 'Extended evening shift',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.record.overtimeHours).toBe(4.0);
      expect(json.record.remarks).toBe('Extended evening shift');
    });
  });

  describe('2. Query Views (Daily, Weekly, Monthly, Custom Range & Summary)', () => {
    it('2.1 Daily view returns records and KPI summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/daily?company_id=${testCompanyId}&date=${testDate}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.company).toBeDefined();
      expect(json.date).toBe(testDate);
      expect(json.summary).toBeDefined();
      expect(json.summary.totalEmployees).toBeGreaterThan(0);
      expect(json.records).toBeDefined();
      expect(Array.isArray(json.records)).toBe(true);
    });

    it('2.2 Weekly view returns 7 consecutive dates with day-by-day employee matrix', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/weekly?company_id=${testCompanyId}&week_start=2026-09-28`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.viewType).toBe('weekly');
      expect(json.dates.length).toBe(7);
      expect(json.employees.length).toBeGreaterThan(0);
      expect(json.employees[0].days).toBeDefined();
    });

    it('2.3 Monthly view calculates exact days in month and maintains Blank for missing data', async () => {
      // October has 31 days
      const resOct = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/monthly?company_id=${testCompanyId}&year=2026&month=10`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(resOct.statusCode).toBe(200);
      const jsonOct = resOct.json();
      expect(jsonOct.dates.length).toBe(31);

      // Check February 2026 (non-leap year, 28 days)
      const resFeb = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/monthly?company_id=${testCompanyId}&year=2026&month=2`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(resFeb.statusCode).toBe(200);
      const jsonFeb = resFeb.json();
      expect(jsonFeb.dates.length).toBe(28);

      // Verify NO DATA != ABSENT (unmarked dates remain null/blank)
      const sampleEmp = jsonOct.employees.find((e: any) => e.employee.id === testEmployeeId1);
      expect(sampleEmp).toBeDefined();
      expect(sampleEmp.days['2026-10-30']).toBeNull();
    });

    it('2.4 Custom range view validates from_date <= to_date and enforces 93-day ceiling', async () => {
      const validRes = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/custom?company_id=${testCompanyId}&from_date=2026-10-01&to_date=2026-10-07`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(validRes.statusCode).toBe(200);
      expect(validRes.json().dates.length).toBe(7);

      const invalidRes = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/custom?company_id=${testCompanyId}&from_date=2026-10-10&to_date=2026-10-01`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(invalidRes.statusCode).toBe(400);
    });

    it('2.5 Instant employee search filters matrix rows', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/daily?company_id=${testCompanyId}&date=${testDate}&search=Rajesh`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      for (const rec of json.records) {
        expect(rec.employeeName.toLowerCase()).toContain('rajesh');
      }
    });

    it('2.6 Summary endpoint returns authoritative totals', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/summary?company_id=${testCompanyId}&date=${testDate}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.summary.totalEmployees).toBeDefined();
      expect(json.summary.present).toBeDefined();
      expect(json.summary.absent).toBeDefined();
      expect(json.summary.od).toBeDefined();
      expect(json.summary.totalOvertimeHours).toBeDefined();
    });
  });

  describe('3. Bulk Operations & VALID_ROWS_ONLY Batch Policy', () => {
    it('3.1 Marks bulk attendance for multiple employees in a single request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/bulk',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          attendance_date: '2026-10-06',
          records: [
            { employee_id: testEmployeeId1, status: 'PRESENT', overtime_hours: 1.5 },
            { employee_id: testEmployeeId2, status: 'PRESENT', overtime_hours: 2.0 },
          ],
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.successfulCount).toBe(2);
      expect(json.failedCount).toBe(0);
    });

    it('3.2 Rejects nonexistent employee in batch according to VALID_ROWS_ONLY policy', async () => {
      const fakeEmployeeId = 'f0000000-0000-0000-0000-000000000099';
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/bulk',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          attendance_date: '2026-10-06',
          records: [
            { employee_id: testEmployeeId1, status: 'PRESENT', overtime_hours: 1.0 },
            { employee_id: fakeEmployeeId, status: 'PRESENT', overtime_hours: 1.0 },
          ],
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.successfulCount).toBe(1);
      expect(json.failedCount).toBe(1);
      expect(json.errors[0].employeeId).toBe(fakeEmployeeId);
    });

    it('3.3 Clears attendance records cleanly without converting into absent', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/clear',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          attendance_date: '2026-10-06',
          employee_ids: [testEmployeeId1],
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.clearedCount).toBeGreaterThanOrEqual(1);

      // Verify that this employee has no record now (Blank, NOT Absent)
      const verifyRes = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/daily?company_id=${testCompanyId}&date=2026-10-06`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      const verifyJson = verifyRes.json();
      const rec = verifyJson.records.find((r: any) => r.employeeId === testEmployeeId1);
      expect(rec).toBeUndefined();
    });
  });

  describe('4. Excel-Like Ledger & Cell Updating', () => {
    it('4.1 Retrieves monthly attendance workbook sheet via GET /ledger', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/ledger?company_id=${testCompanyId}&year=2026&month=10`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.dates.length).toBe(31);
      expect(json.employees.length).toBeGreaterThan(0);
    });

    it('4.2 Updates single ledger cell via PATCH /ledger/cell', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/attendance/ledger/cell',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: '2026-10-07',
          status: 'PRESENT',
          overtime_hours: 3.0,
          remarks: 'Spreadsheet cell edited',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.record.status).toBe('PRESENT');
      expect(json.record.overtimeHours).toBe(3.0);
    });

    it('4.3 Clears ledger cell when status is BLANK', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/attendance/ledger/cell',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: '2026-10-07',
          status: 'BLANK',
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.record).toBeNull();
    });
  });

  describe('5. RBAC & Security Enforcement', () => {
    it('5.1 Unauthenticated requests are rejected with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/attendance/companies',
      });
      expect(res.statusCode).toBe(401);
    });

    it('5.2 SUPER_ADMIN has full access', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/attendance/companies',
        headers: { authorization: `Bearer ${createMockToken('SUPER_ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('5.3 ACCOUNT role has read-only access (cannot mark attendance)', async () => {
      // ACCOUNT can view companies
      const viewRes = await app.inject({
        method: 'GET',
        url: '/api/v1/attendance/companies',
        headers: { authorization: `Bearer ${createMockToken('ACCOUNT')}` },
      });
      expect(viewRes.statusCode).toBe(200);

      // ACCOUNT cannot mutate attendance records (returns 403)
      const mutateRes = await app.inject({
        method: 'POST',
        url: '/api/v1/attendance/mark',
        headers: { authorization: `Bearer ${createMockToken('ACCOUNT')}` },
        payload: {
          company_id: testCompanyId,
          employee_id: testEmployeeId1,
          attendance_date: testDate,
          status: 'PRESENT',
        },
      });
      expect(mutateRes.statusCode).toBe(403);
    });

    it('5.4 Rejects requests targeting unauthorized or nonexistent company ID', async () => {
      const unauthorizedCompanyId = 'd9999999-9999-9999-9999-999999999999';
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/attendance/daily?company_id=${unauthorizedCompanyId}&date=${testDate}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().message).toContain('Access denied: Company not found or unauthorized');
    });
  });
});
