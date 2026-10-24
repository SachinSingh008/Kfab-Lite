import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

function createMockToken(
  role: string,
  id: string = '00000000-0000-0000-0000-000000000001',
  name: string = 'Test User'
): string {
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

describe('KFab360 Home Dashboard Module Test Suite', () => {
  let app: FastifyInstance;
  const companyId = 'c0000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication & Role Scoping', () => {
    it('1.1 Rejects unauthenticated requests with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/overview',
      });
      expect(res.statusCode).toBe(401);
    });

    it('1.2 SUPER_ADMIN can query consolidated dashboard overview across all companies', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/overview?companyId=all&period=today',
        headers: { authorization: `Bearer ${createMockToken('SUPER_ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.data).toBeDefined();
      expect(json.data.kpiCards).toBeDefined();
      expect(json.data.kpiCards.attendance).toBeDefined();
      expect(json.data.kpiCards.projects).toBeDefined();
      expect(json.data.kpiCards.emergencies).toBeDefined();
      expect(json.data.kpiCards.bills.isAuthorized).toBe(true);
    });

    it('1.3 ADMIN can query dashboard overview for their authorized company', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}&period=this_week`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.data.activeCompanyId).toBe(companyId);
      expect(json.data.kpiCards.bills.isAuthorized).toBe(true);
    });

    it('1.4 SUPERVISOR accessing an unauthorized company returns 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/overview?companyId=unauthorized-company-uuid',
        headers: {
          authorization: `Bearer ${createMockToken(
            'SUPERVISOR',
            '00000000-0000-0000-0000-000000000003',
            'Site Supervisor'
          )}`,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('1.5 SUPERVISOR dashboard restricts financial totals to preserve privacy', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: {
          authorization: `Bearer ${createMockToken(
            'SUPERVISOR',
            '00000000-0000-0000-0000-000000000003',
            'Site Supervisor'
          )}`,
        },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.data.kpiCards.bills.isAuthorized).toBe(false);
      expect(json.data.financialOverview.isAuthorized).toBe(false);
      expect(json.data.supervisorSections).toBeDefined();
      expect(Array.isArray(json.data.supervisorSections)).toBe(true);
    });
  });

  describe('2. Four KPI Cards Accuracy', () => {
    it('2.1 Attendance KPI accurately aggregates present, absent, and OD', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const att = res.json().data.kpiCards.attendance;
      expect(att.totalEmployees).toBeGreaterThanOrEqual(1);
      expect(att.presentToday + att.absentToday + att.odToday).toBeLessThanOrEqual(att.totalEmployees);
      expect(typeof att.turnoutRate).toBe('number');
    });

    it('2.2 Projects KPI accurately counts active, on-track, delayed, and completed', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const proj = res.json().data.kpiCards.projects;
      expect(typeof proj.totalActive).toBe('number');
      expect(typeof proj.onTrack).toBe('number');
      expect(typeof proj.delayed).toBe('number');
      expect(typeof proj.completed).toBe('number');
    });

    it('2.3 Compact project summary sorts delayed projects first', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const rows = res.json().data.projectSummaryRows;
      expect(Array.isArray(rows)).toBe(true);
      if (rows.length >= 2) {
        // If there is any delayed project, it must precede non-delayed ones
        const delayedIndices = rows.map((r: any, idx: number) => (r.isDelayed ? idx : -1)).filter((idx: number) => idx !== -1);
        const nonDelayedIndices = rows.map((r: any, idx: number) => (!r.isDelayed ? idx : -1)).filter((idx: number) => idx !== -1);
        if (delayedIndices.length > 0 && nonDelayedIndices.length > 0) {
          expect(Math.max(...delayedIndices)).toBeLessThan(Math.min(...nonDelayedIndices));
        }
      }
    });
  });

  describe('3. Financial Overview & Costing', () => {
    it('3.1 Distinguishes Money Needed, Money Coming In, and Money Consumed', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ACCOUNT')}` },
      });
      expect(res.statusCode).toBe(200);
      const fin = res.json().data.financialOverview;
      expect(fin.isAuthorized).toBe(true);
      expect(fin.moneyNeeded.totalPayables).toBeGreaterThan(0);
      expect(fin.moneyComingIn.totalReceivables).toBeGreaterThan(0);
      expect(fin.moneyConsumed.totalExpensesRecorded).toBeGreaterThan(0);
      expect(Array.isArray(fin.projectCosting)).toBe(true);
    });
  });

  describe('4. Material Consumption & Accountability', () => {
    it('4.1 Returns material consumption totals and category breakdown', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const mat = res.json().data.materialConsumption;
      expect(mat.totalConsumptionCost).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(mat.categories)).toBe(true);
      expect(Array.isArray(mat.issueAccountabilityRows)).toBe(true);
    });

    it('4.2 Returns paginated material issues accountability table via dedicated endpoint', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/material-issues?companyId=${companyId}&page=1&limit=5`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.page).toBe(1);
      expect(json.limit).toBe(5);
      expect(Array.isArray(json.rows)).toBe(true);
      if (json.rows.length > 0) {
        const first = json.rows[0];
        expect(first.itemCode).toBeDefined();
        expect(first.employeeName).toBeDefined();
        expect(first.quantity).toBeDefined();
        expect(first.returnStatus).toBeDefined();
      }
    });
  });

  describe('5. Supervisor Issue Management & Action List', () => {
    it('5.1 Creates a new plant issue ticket from the dashboard', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/dashboard/issues',
        headers: {
          authorization: `Bearer ${createMockToken(
            'SUPERVISOR',
            '00000000-0000-0000-0000-000000000003',
            'Site Supervisor'
          )}`,
        },
        payload: {
          projectId: '10000000-0000-0000-0000-000000000001',
          title: 'Crane Operator Shift Overtime Approval Required',
          description: 'EOT Crane 15T needed for 3 hours night shift for heavy box girder handling.',
          priority: 'HIGH',
          category: 'Shop Floor Bottleneck',
        },
      });
      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.data.title).toBe('Crane Operator Shift Overtime Approval Required');
      expect(json.data.priority).toBe('HIGH');
      expect(json.data.code).toMatch(/^ISS-/);
    });

    it('5.2 Returns practical action items for supervisor', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/dashboard/overview?companyId=${companyId}`,
        headers: {
          authorization: `Bearer ${createMockToken(
            'SUPERVISOR',
            '00000000-0000-0000-0000-000000000003',
            'Site Supervisor'
          )}`,
        },
      });
      expect(res.statusCode).toBe(200);
      const actionList = res.json().data.actionList;
      expect(Array.isArray(actionList)).toBe(true);
      expect(actionList.length).toBeGreaterThan(0);
    });
  });
});
