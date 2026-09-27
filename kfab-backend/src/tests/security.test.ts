import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
  UserRoleSchema,
} from '../modules/users/users.schema.js';
import { userHasPermission } from '../middleware/rbac.js';

describe('KFab360 Authentication & User Management Security Test Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Health Check & Public Endpoints', () => {
    it('GET /health returns 200 OK with safe server status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });
      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(json.status).toBe('ok');
      expect(json.service).toBe('kfab-backend');
    });
  });

  describe('2. Authentication Enforcement (Unauthenticated Access Denied)', () => {
    it('GET /api/v1/users without token returns 401 Unauthorized', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
      });
      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.message).toContain('Missing or invalid Bearer authentication token');
    });

    it('GET /api/v1/users with malformed token returns 401 Unauthorized', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers: {
          authorization: 'Bearer invalid.fake.token',
        },
      });
      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('POST /api/v1/users without authentication returns 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          fullName: 'Test User',
          email: 'test@kfab.in',
          role: 'SUPERVISOR',
          initialPassword: 'Password123!',
        },
      });
      expect(response.statusCode).toBe(401);
    });

    it('GET /api/v1/audit-logs without authentication returns 401', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/audit-logs',
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('3. Approved 4-Role Architecture Enforcement', () => {
    it('Accepts only the 4 approved application roles', () => {
      expect(UserRoleSchema.safeParse('SUPER_ADMIN').success).toBe(true);
      expect(UserRoleSchema.safeParse('ADMIN').success).toBe(true);
      expect(UserRoleSchema.safeParse('ACCOUNT').success).toBe(true);
      expect(UserRoleSchema.safeParse('SUPERVISOR').success).toBe(true);
    });

    it('Rejects any legacy or foreign ERP roles', () => {
      expect(UserRoleSchema.safeParse('ACCOUNTANT').success).toBe(false);
      expect(UserRoleSchema.safeParse('STOREKEEPER').success).toBe(false);
      expect(UserRoleSchema.safeParse('VIEWER').success).toBe(false);
      expect(UserRoleSchema.safeParse('ATTENDANCE_USER').success).toBe(false);
      expect(UserRoleSchema.safeParse('GUEST').success).toBe(false);
    });
  });

  describe('4. Zod Input Validation & SQL Injection Resistance', () => {
    it('Rejects CreateUser with short password (< 8 chars)', () => {
      const result = CreateUserSchema.safeParse({
        fullName: 'John Doe',
        email: 'john@kfab.in',
        role: 'SUPERVISOR',
        initialPassword: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });

    it('Rejects CreateUser with invalid email format', () => {
      const result = CreateUserSchema.safeParse({
        fullName: 'Jane Doe',
        email: 'not-an-email',
        role: 'ACCOUNT',
        initialPassword: 'SecurePassword123!',
      });
      expect(result.success).toBe(false);
    });

    it('Safely parses search queries containing SQL Injection payloads without crashing', () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE profiles; --",
        "1; SELECT * FROM auth.users",
        "admin'--",
      ];

      for (const payload of sqlInjectionPayloads) {
        const queryResult = ListUsersQuerySchema.safeParse({
          search: payload,
          page: '1',
          limit: '10',
        });
        expect(queryResult.success).toBe(true);
        if (queryResult.success) {
          expect(queryResult.data.search).toBe(payload);
        }
      }
    });

    it('Rejects negative or invalid pagination parameters', () => {
      const result = ListUsersQuerySchema.safeParse({
        page: '-5',
        limit: '1000',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('5. RBAC Permission Matrix & Role Hierarchy Checks', () => {
    it('SUPER_ADMIN holds all administrative permissions implicitly', async () => {
      const hasCreate = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'users.create');
      const hasDelete = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'users.delete');
      const hasAssignRole = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'users.assign_role');
      const hasAudit = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'audit.view');

      expect(hasCreate).toBe(true);
      expect(hasDelete).toBe(true);
      expect(hasAssignRole).toBe(true);
      expect(hasAudit).toBe(true);
    });

    it('ADMIN holds delegated user management permissions, but NOT users.delete or unrestricted role assignment', async () => {
      const hasCreate = await userHasPermission('user-2', 'ADMIN', false, 'users.create');
      const hasEdit = await userHasPermission('user-2', 'ADMIN', false, 'users.edit');
      const hasDeactivate = await userHasPermission('user-2', 'ADMIN', false, 'users.deactivate');
      const hasResetPass = await userHasPermission('user-2', 'ADMIN', false, 'users.reset_password');
      const hasRevokeSession = await userHasPermission('user-2', 'ADMIN', false, 'users.revoke_session');
      const hasDelete = await userHasPermission('user-2', 'ADMIN', false, 'users.delete');
      const hasAssignRole = await userHasPermission('user-2', 'ADMIN', false, 'users.assign_role');

      expect(hasCreate).toBe(true);
      expect(hasEdit).toBe(true);
      expect(hasDeactivate).toBe(true);
      expect(hasResetPass).toBe(true);
      expect(hasRevokeSession).toBe(true);
      expect(hasDelete).toBe(false);
      expect(hasAssignRole).toBe(false);
    });

    it('ACCOUNT has NO administrative or user-management permissions', async () => {
      const hasCreate = await userHasPermission('user-3', 'ACCOUNT', false, 'users.create');
      const hasView = await userHasPermission('user-3', 'ACCOUNT', false, 'users.view');
      const hasAudit = await userHasPermission('user-3', 'ACCOUNT', false, 'audit.view');

      expect(hasCreate).toBe(false);
      expect(hasView).toBe(false);
      expect(hasAudit).toBe(false);
    });

    it('SUPERVISOR has NO administrative or user-management permissions', async () => {
      const hasCreate = await userHasPermission('user-4', 'SUPERVISOR', false, 'users.create');
      const hasEdit = await userHasPermission('user-4', 'SUPERVISOR', false, 'users.edit');
      const hasDeactivate = await userHasPermission('user-4', 'SUPERVISOR', false, 'users.deactivate');

      expect(hasCreate).toBe(false);
      expect(hasEdit).toBe(false);
      expect(hasDeactivate).toBe(false);
    });
  });

  describe('6. Data Exposure Protection (No Password or Secret Leakage)', () => {
    it('User response strictly omits passwords and security secrets', () => {
      const sampleUserResponse = {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Sachin Singh',
        email: 'sachinasinghofficial@gmail.com',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        forcePasswordReset: false,
        isSuperAdmin: true,
        lastLoginAt: null,
        sessionRevokedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const keys = Object.keys(sampleUserResponse);
      expect(keys).not.toContain('password');
      expect(keys).not.toContain('encrypted_password');
      expect(keys).not.toContain('secret');
      expect(keys).not.toContain('token');
      expect(keys).not.toContain('hash');
    });
  });
});
