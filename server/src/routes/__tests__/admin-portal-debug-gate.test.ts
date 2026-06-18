import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminPortalTestingRouter from '../admin-portal-testing';
import {
  ADMIN_PORTAL_DEBUG_ENV_VAR,
  isAdminPortalDebugEnabled,
} from '../admin-portal/adminPortalDebugGate';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const execMock = vi.fn();

vi.mock('child_process', () => ({
  exec: (
    cmd: string,
    options: unknown,
    callback?: (error: null, stdout: string, stderr: string) => void,
  ) => {
    execMock(cmd);
    if (typeof options === 'function') {
      options(null, '{}', '');
      return;
    }
    if (callback) {
      callback(null, '{}', '');
    }
  },
}));

function createTestingApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/admin-portal/testing', adminPortalTestingRouter);
  return app;
}

function expectNoCommandExposure(body: Record<string, unknown>): void {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain('pnpm test');
  expect(serialized).not.toContain('child_process');
}

describe('AP-F-020/AP-F-021 admin portal debug surface gating', () => {
  const app = createTestingApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];
  let originalDebugEnv: string | undefined;

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  beforeEach(() => {
    originalDebugEnv = process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];
    delete process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];
    execMock.mockClear();
  });

  afterEach(() => {
    if (originalDebugEnv === undefined) {
      delete process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];
    } else {
      process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = originalDebugEnv;
    }
  });

  describe('adminPortalDebugGate helper', () => {
    it('is disabled by default', () => {
      delete process.env[ADMIN_PORTAL_DEBUG_ENV_VAR];
      expect(isAdminPortalDebugEnabled()).toBe(false);
    });

    it('is enabled only when env var is true', () => {
      process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = 'true';
      expect(isAdminPortalDebugEnabled()).toBe(true);
    });
  });

  describe('when debug gate is disabled', () => {
    it('rejects GET /status without executing shell commands', async () => {
      const response = await request(app)
        .get('/api/admin-portal/testing/status')
        .set(createAuthHeader(adminUser))
        .expect(403);

      expect(response.body).toHaveProperty(
        'error',
        'Admin portal debug tools are disabled in this environment',
      );
      expectNoCommandExposure(response.body);
      expect(execMock).not.toHaveBeenCalled();
    });

    it('rejects POST /run without executing shell commands', async () => {
      const response = await request(app)
        .post('/api/admin-portal/testing/run')
        .set(createAuthHeader(adminUser))
        .send({ testFile: 'example.test.ts' })
        .expect(403);

      expect(response.body).toHaveProperty(
        'error',
        'Admin portal debug tools are disabled in this environment',
      );
      expectNoCommandExposure(response.body);
      expect(execMock).not.toHaveBeenCalled();
    });

    it('rejects unauthenticated requests before auth middleware', async () => {
      const response = await request(app)
        .get('/api/admin-portal/testing/list')
        .expect(403);

      expect(response.body).toHaveProperty(
        'error',
        'Admin portal debug tools are disabled in this environment',
      );
      expect(execMock).not.toHaveBeenCalled();
    });
  });

  describe('when debug gate is enabled', () => {
    beforeEach(() => {
      process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] = 'true';
    });

    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/admin-portal/testing/list')
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access token required');
      expect(execMock).not.toHaveBeenCalled();
    });

    it('rejects authenticated non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin-portal/testing/list')
        .set(createAuthHeader(regularUser))
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
      expect(execMock).not.toHaveBeenCalled();
    });

    it('allows authenticated admin requests to reach handlers', async () => {
      const response = await request(app)
        .get('/api/admin-portal/testing/list')
        .set(createAuthHeader(adminUser))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(execMock).toHaveBeenCalled();
    });
  });
});
