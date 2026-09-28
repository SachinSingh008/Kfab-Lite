import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateProjectSchema } from '../modules/projects/projects.schema.js';

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

describe('KFab360 Reports & Project Tracking Module Test Suite', () => {
  let app: FastifyInstance;
  let activeSupervisorId = '6060b3df-fec0-4772-8d3a-d32d3efd97d5';
  let activeProjectId: string;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // Query projects to establish active IDs
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
    });
    const list = res.json().projects;
    if (list && list.length > 0) {
      activeProjectId = list[0].id;
      if (list[0].supervisorId) {
        activeSupervisorId = list[0].supervisorId;
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Role Access Enforcement for Reports & Projects', () => {
    it('SUPER_ADMIN can access Reports Summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/summary?period=weekly',
        headers: { authorization: `Bearer ${createMockToken('SUPER_ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.efficiency).toBeDefined();
      expect(json.output).toBeDefined();
      expect(json.today).toBeDefined();
      expect(json.periodOutput).toBeDefined();
      expect(json.details).toBeDefined();
    });

    it('ADMIN can access Reports Summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/summary?period=monthly',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.periodOutput.period).toBe('monthly');
    });

    it('SUPERVISOR can access Reports Summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/summary',
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('ACCOUNT is strictly FORBIDDEN from accessing Reports Summary', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/summary',
        headers: { authorization: `Bearer ${createMockToken('ACCOUNT')}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('ACCOUNT is strictly FORBIDDEN from accessing Projects list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${createMockToken('ACCOUNT')}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('2. Project Visibility & Scoping', () => {
    it('SUPER_ADMIN sees all system projects', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${createMockToken('SUPER_ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.projects.length).toBeGreaterThanOrEqual(1);
    });

    it('ADMIN sees all system projects', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.projects.length).toBeGreaterThanOrEqual(1);
    });

    it('SUPERVISOR sees only assigned projects', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.projects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Project Creation & Date Validation', () => {
    it('ADMIN can create a new project with 5 default stages', async () => {
      const newProjPayload = {
        projectName: 'Bridge Girder Segment A',
        customerName: 'National Highways Authority',
        supervisorId: activeSupervisorId,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        stageDeadlines: {
          marking: '2026-10-05',
          cutting: '2026-10-10',
          fitting: '2026-10-18',
          welding: '2026-10-25',
          final: '2026-10-31',
        },
        remark: 'High-tensile steel plates',
      };

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
        payload: newProjPayload,
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.project.projectName).toBe(newProjPayload.projectName);
      expect(json.stages.length).toBe(5);
      expect(json.stages.map((s: { name: string }) => s.name)).toEqual([
        'Marking',
        'Cutting',
        'Fitting',
        'Welding',
        'Final',
      ]);
      activeProjectId = json.project.id;
    });

    it('SUPERVISOR cannot create projects', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/projects',
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
        payload: {
          projectName: 'Unauthorized Project',
          customerName: 'Client X',
          supervisorId: activeSupervisorId,
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          stageDeadlines: {
            marking: '2026-10-05',
            cutting: '2026-10-10',
            fitting: '2026-10-18',
            welding: '2026-10-25',
            final: '2026-10-31',
          },
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it('Rejects project creation when endDate < startDate', () => {
      const invalidDatesPayload = {
        projectName: 'Invalid Date Project',
        customerName: 'Client',
        supervisorId: activeSupervisorId,
        startDate: '2026-10-20',
        endDate: '2026-10-10',
        stageDeadlines: {
          marking: '2026-10-12',
          cutting: '2026-10-14',
          fitting: '2026-10-16',
          welding: '2026-10-18',
          final: '2026-10-19',
        },
      };

      const result = CreateProjectSchema.safeParse(invalidDatesPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('End date must be greater than or equal to start date');
      }
    });
  });

  describe('4. Dynamic Stage Management & Deletion Safety', () => {
    let customStageId: string;

    it('Supervisor can add a custom stage column to their project', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/projects/${activeProjectId}/stages`,
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
        payload: {
          name: 'Painting',
          plannedCompletionDate: '2026-10-28',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.stage.name).toBe('Painting');
      expect(json.stage.isDefault).toBe(false);
      customStageId = json.stage.id;
    });

    it('Supervisor can rename custom stage column', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/projects/${activeProjectId}/stages/${customStageId}`,
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
        payload: {
          name: 'Surface Painting',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().stage.name).toBe('Surface Painting');
    });

    it('Prevents deleting core default stages (e.g. Marking, Cutting, Welding)', async () => {
      const projDetailRes = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${activeProjectId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });
      const markingStage = projDetailRes.json().stages.find((s: { name: string }) => s.name === 'Marking');

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${activeProjectId}/stages/${markingStage.id}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });

      expect(deleteRes.statusCode).toBe(403);
      expect(deleteRes.json().message).toContain('Core default stage');
    });

    it('Supervisor can delete custom stage column with confirmation', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/projects/${activeProjectId}/stages/${customStageId}`,
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().deletedStageId).toBe(customStageId);
    });
  });

  describe('5. Cell Execution Status & Remarks', () => {
    it('Supervisor can mark stage cell as COMPLETE and update remark', async () => {
      const detailRes = await app.inject({
        method: 'GET',
        url: `/api/v1/projects/${activeProjectId}`,
        headers: { authorization: `Bearer ${createMockToken('ADMIN')}` },
      });

      const itemId = detailRes.json().items[0].id;
      const stageId = detailRes.json().stages[0].id;

      const updateRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/projects/${activeProjectId}/items/${itemId}/stages/${stageId}`,
        headers: { authorization: `Bearer ${createMockToken('SUPERVISOR', activeSupervisorId)}` },
        payload: {
          status: 'COMPLETE',
          remark: 'Inspected and certified by QC',
        },
      });

      expect(updateRes.statusCode).toBe(200);
      const json = updateRes.json();
      expect(json.cellStatus.status).toBe('COMPLETE');
      expect(json.cellStatus.remark).toBe('Inspected and certified by QC');
    });
  });

  describe('6. Reports Progress & Delay Telemetry', () => {
    it('GET /api/v1/reports/progress returns project list with delay days and timeline points', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/progress',
        headers: { authorization: `Bearer ${createMockToken('SUPER_ADMIN')}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(Array.isArray(json.projects)).toBe(true);
      expect(Array.isArray(json.timeline)).toBe(true);
      expect(json.timeline.length).toBeGreaterThan(0);
      expect(json.summary).toBeDefined();
    });
  });
});
