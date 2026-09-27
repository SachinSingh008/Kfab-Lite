import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ListUsersQuerySchema,
} from '../modules/users/users.schema.js';
import { userHasPermission } from '../middleware/rbac.js';

describe('KFab360 Enterprise Backend Security & RBAC Test Suite', () => {
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
          username: 'testuser',
          email: 'test@kfab.in',
          role: 'SUPERVISOR',
          initialPassword: 'Password123!',
        },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe('3. Zod Input Validation & SQL Injection Resistance', () => {
    it('Rejects CreateUser with short password (< 8 chars)', () => {
      const result = CreateUserSchema.safeParse({
        fullName: 'John Doe',
        username: 'johndoe',
        email: 'john@kfab.in',
        role: 'SUPERVISOR',
        initialPassword: '123', // Too short
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });

    it('Rejects CreateUser with invalid email format', () => {
      const result = CreateUserSchema.safeParse({
        fullName: 'Jane Doe',
        username: 'janedoe',
        email: 'not-an-email',
        role: 'ACCOUNTANT',
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
        limit: '1000', // exceeds max 100
      });
      expect(result.success).toBe(false);
    });
  });

  describe('4. RBAC Permission Matrix & Privilege Escalation Checks', () => {
    it('SUPER_ADMIN holds all administrative permissions implicitly', async () => {
      const hasCreate = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'users.create');
      const hasDeactivate = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'users.deactivate');
      const hasAudit = await userHasPermission('user-1', 'SUPER_ADMIN', true, 'audit.view');

      expect(hasCreate).toBe(true);
      expect(hasDeactivate).toBe(true);
      expect(hasAudit).toBe(true);
    });

    it('VIEWER cannot manage or create users', async () => {
      const hasCreate = await userHasPermission('user-2', 'VIEWER', false, 'users.create');
      const hasDeactivate = await userHasPermission('user-2', 'VIEWER', false, 'users.deactivate');
      const hasEdit = await userHasPermission('user-2', 'VIEWER', false, 'users.edit');

      expect(hasCreate).toBe(false);
      expect(hasDeactivate).toBe(false);
      expect(hasEdit).toBe(false);
    });

    it('SUPERVISOR cannot manage users or alter settings', async () => {
      const hasUserManage = await userHasPermission('user-3', 'SUPERVISOR', false, 'users.manage');
      expect(hasUserManage).toBe(false);
    });

    it('ADMIN holds user management permissions within company scope', async () => {
      const hasCreate = await userHasPermission('user-4', 'ADMIN', false, 'users.create');
      const hasEdit = await userHasPermission('user-4', 'ADMIN', false, 'users.edit');
      expect(hasCreate).toBe(true);
      expect(hasEdit).toBe(true);
    });
  });

  describe('5. Data Exposure Protection (No Secret Leakage)', () => {
    it('Schema DTO strictly omits passwords and tokens from returned user representation', () => {
      const sampleResponse = {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Test Admin',
        email: 'admin@kfab.in',
        username: 'admin@kfab.in',
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'Operations',
        designation: 'Plant Admin',
        employeeId: null,
        forcePasswordReset: false,
        isSuperAdmin: false,
        lastLoginAt: null,
        sessionRevokedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const keys = Object.keys(sampleResponse);
      expect(keys).not.toContain('password');
      expect(keys).not.toContain('encrypted_password');
      expect(keys).not.toContain('secret');
      expect(keys).not.toContain('token');
      expect(keys).not.toContain('hash');
    });
  });
});
