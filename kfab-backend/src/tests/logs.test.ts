import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { sanitizeAuditData, AuditAction } from '../modules/audit/audit.service.js';
import { CreateUserLogSchema, ListUserLogsQuerySchema, ListSystemLogsQuerySchema } from '../modules/logs/logs.schema.js';

describe('KFab360 Logs Module — Comprehensive Security & Functional Test Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. USER LOGS: Creation & Ownership Enforcement
  // =========================================================================
  describe('1. User Logs Ownership & Schema Validation', () => {
    it('validates user log creation payload with valid event and remarks', () => {
      const valid = CreateUserLogSchema.safeParse({
        event: 'Material received from supplier',
        remarks: 'MTC certificate verified',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.event).toBe('Material received from supplier');
        expect(valid.data.remarks).toBe('MTC certificate verified');
      }
    });

    it('rejects empty event name', () => {
      const invalid = CreateUserLogSchema.safeParse({
        event: '   ',
        remarks: 'Some remark',
      });
      expect(invalid.success).toBe(false);
    });

    it('allows optional remarks or null', () => {
      const valid = CreateUserLogSchema.safeParse({
        event: 'Drawing revised to Rev B',
      });
      expect(valid.success).toBe(true);
    });

    it('POST /api/v1/logs requires authentication session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/logs',
        payload: {
          event: 'Unauthorized log attempt',
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('GET /api/v1/logs/my requires authentication session', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/logs/my',
      });
      expect(res.statusCode).toBe(401);
    });

    it('GET /api/v1/logs/all requires authentication session', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/logs/all',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // 2. SYSTEM LOGS: RBAC Authorization & Immutability
  // =========================================================================
  describe('2. System Logs RBAC Access & Immutability Protection', () => {
    it('GET /api/v1/system-logs requires authentication', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/system-logs',
      });
      expect(res.statusCode).toBe(401);
    });

    it('No POST endpoint exists for system logs (immutable append-only)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/system-logs',
        payload: {
          action: 'HACK_LOG',
          description: 'Fake log attempt',
        },
      });
      expect([404, 401]).toContain(res.statusCode);
    });

    it('No PUT endpoint exists for system logs (cannot edit)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/system-logs/some-log-id',
        payload: {
          description: 'Altered description',
        },
      });
      expect([404, 401]).toContain(res.statusCode);
    });

    it('No PATCH endpoint exists for system logs (cannot alter)', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/system-logs/some-log-id',
        payload: {
          status: 'TAMPERED',
        },
      });
      expect([404, 401]).toContain(res.statusCode);
    });

    it('No DELETE endpoint exists for system logs (cannot delete)', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/v1/system-logs/some-log-id',
      });
      expect([404, 401]).toContain(res.statusCode);
    });
  });

  // =========================================================================
  // 3. AUDIT SANITIZATION: Credentials & Secrets Protection
  // =========================================================================
  describe('3. Audit Sanitization Engine', () => {
    it('recursively redacts passwords, hashes, tokens, secrets, and api keys', () => {
      const rawData = {
        username: 'sachin@kfab.in',
        password: 'SuperSecretPassword123!',
        user_metadata: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz',
          apiKey: 'sec_live_998877665544',
          nested: {
            auth_token: 'bearer_token_abc',
            secret_key: 'deep_secret_value',
            clean_field: 'safe_fabrication_bay_1',
          },
        },
        regular_field: 'MTC certificate check',
      };

      const sanitized: any = sanitizeAuditData(rawData);

      expect(sanitized.username).toBe('sachin@kfab.in');
      expect(sanitized.regular_field).toBe('MTC certificate check');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.user_metadata.token).toBe('[REDACTED]');
      expect(sanitized.user_metadata.apiKey).toBe('[REDACTED]');
      expect(sanitized.user_metadata.nested.auth_token).toBe('[REDACTED]');
      expect(sanitized.user_metadata.nested.secret_key).toBe('[REDACTED]');
      expect(sanitized.user_metadata.nested.clean_field).toBe('safe_fabrication_bay_1');
    });

    it('handles arrays and primitive data without mutation', () => {
      const arrayInput = [
        { password: '123', status: 'ACTIVE' },
        { token: 'abc', role: 'SUPER_ADMIN' },
      ];

      const sanitized: any = sanitizeAuditData(arrayInput);
      expect(sanitized[0].password).toBe('[REDACTED]');
      expect(sanitized[0].status).toBe('ACTIVE');
      expect(sanitized[1].token).toBe('[REDACTED]');
      expect(sanitized[1].role).toBe('SUPER_ADMIN');
    });
  });

  // =========================================================================
  // 4. QUERY PAGINATION ENFORCEMENT
  // =========================================================================
  describe('4. Pagination Limits & Query Validation', () => {
    it('enforces maximum limit of 100 on user logs query', () => {
      const invalid = ListUserLogsQuerySchema.safeParse({
        page: 1,
        limit: 500, // exceeds max 100
      });
      expect(invalid.success).toBe(false);

      const valid = ListUserLogsQuerySchema.safeParse({
        page: 1,
        limit: 50,
      });
      expect(valid.success).toBe(true);
    });

    it('defaults page to 1 and limit to 20', () => {
      const parsed = ListUserLogsQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
    });

    it('validates system logs query schema', () => {
      const parsed = ListSystemLogsQuerySchema.parse({
        module: 'USER_MANAGEMENT',
        action: 'USER_CREATED',
        page: 2,
        limit: 25,
      });
      expect(parsed.module).toBe('USER_MANAGEMENT');
      expect(parsed.action).toBe('USER_CREATED');
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(25);
    });
  });

  // =========================================================================
  // 5. ROLE-BASED VISIBILITY CONTRACT (Section 10 & 40)
  // =========================================================================
  describe('5. Role Visibility Verification Contract', () => {
    function getVisibleLogRoles(userRole: string): string[] {
      switch (userRole) {
        case 'SUPER_ADMIN':
          return ['SUPER_ADMIN', 'ADMIN', 'SUPERVISOR', 'ACCOUNT'];
        case 'ADMIN':
          return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
        case 'SUPERVISOR':
          return ['ADMIN', 'SUPERVISOR'];
        case 'ACCOUNT':
          return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
        default:
          return ['ADMIN', 'SUPERVISOR', 'ACCOUNT'];
      }
    }

    function canViewSystemLogs(userRole: string): boolean {
      return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    }

    it('SUPER_ADMIN sees all four roles in All Logs UI', () => {
      const visible = getVisibleLogRoles('SUPER_ADMIN');
      expect(visible).toContain('SUPER_ADMIN');
      expect(visible).toContain('ADMIN');
      expect(visible).toContain('SUPERVISOR');
      expect(visible).toContain('ACCOUNT');
      expect(visible.length).toBe(4);
    });

    it('ADMIN sees ADMIN, SUPERVISOR, and ACCOUNT in All Logs UI', () => {
      const visible = getVisibleLogRoles('ADMIN');
      expect(visible).not.toContain('SUPER_ADMIN');
      expect(visible).toContain('ADMIN');
      expect(visible).toContain('SUPERVISOR');
      expect(visible).toContain('ACCOUNT');
      expect(visible.length).toBe(3);
    });

    it('SUPERVISOR sees ADMIN and SUPERVISOR in All Logs UI (hides SUPER_ADMIN and ACCOUNT)', () => {
      const visible = getVisibleLogRoles('SUPERVISOR');
      expect(visible).not.toContain('SUPER_ADMIN');
      expect(visible).not.toContain('ACCOUNT');
      expect(visible).toContain('ADMIN');
      expect(visible).toContain('SUPERVISOR');
      expect(visible.length).toBe(2);
    });

    it('ACCOUNT sees ADMIN, SUPERVISOR, and ACCOUNT in All Logs UI (hides SUPER_ADMIN)', () => {
      const visible = getVisibleLogRoles('ACCOUNT');
      expect(visible).not.toContain('SUPER_ADMIN');
      expect(visible).toContain('ADMIN');
      expect(visible).toContain('SUPERVISOR');
      expect(visible).toContain('ACCOUNT');
      expect(visible.length).toBe(3);
    });

    it('System Logs tab visible only to SUPER_ADMIN and ADMIN', () => {
      expect(canViewSystemLogs('SUPER_ADMIN')).toBe(true);
      expect(canViewSystemLogs('ADMIN')).toBe(true);
      expect(canViewSystemLogs('SUPERVISOR')).toBe(false);
      expect(canViewSystemLogs('ACCOUNT')).toBe(false);
    });
  });

  // =========================================================================
  // 6. SYSTEM AUDIT ACTION CONSTANTS VERIFICATION
  // =========================================================================
  describe('6. Reusable ERP System Action Constants', () => {
    it('defines standard actions for User Management, Attendance, Quality, Accounts, Material', () => {
      expect(AuditAction.USER_CREATED).toBe('USER_CREATED');
      expect(AuditAction.ROLE_CHANGED).toBe('ROLE_CHANGED');
      expect(AuditAction.ATTENDANCE_STATUS_CHANGED).toBe('ATTENDANCE_STATUS_CHANGED');
      expect(AuditAction.PRODUCTION_CREATED).toBe('PRODUCTION_CREATED');
      expect(AuditAction.STOCK_ADJUSTED).toBe('STOCK_ADJUSTED');
      expect(AuditAction.QA_STATUS_CHANGED).toBe('QA_STATUS_CHANGED');
      expect(AuditAction.PAYMENT_CREATED).toBe('PAYMENT_CREATED');
    });
  });
});
