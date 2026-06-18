import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import { prisma } from '../../lib/prisma';
import {
  DANGEROUS_MIGRATION_OP_CONFIRM,
  ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR,
} from '../admin-portal/adminPortalShared';
import type { User } from '@prisma/client';

const DELETE_PATH = '/api/admin-portal/database/migrations/delete';
const RESET_PATH = '/api/admin-portal/database/migrations/reset-baseline';

const deletePayload = {
  migrationName: '20240101_test_migration',
  confirm: DANGEROUS_MIGRATION_OP_CONFIRM.DELETE,
};

const resetPayload = {
  confirm: DANGEROUS_MIGRATION_OP_CONFIRM.RESET_BASELINE,
};

function expectNoSqlExposure(body: Record<string, unknown>): void {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain('_prisma_migrations');
  expect(serialized).not.toContain('DELETE FROM');
}

describe('AP-F-002 dangerous migration operation hardening', () => {
  const app = createTestApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];
  let executeRawSpy: MockInstance;
  let queryRawSpy: MockInstance;
  let originalDangerousOpsEnv: string | undefined;

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  beforeEach(() => {
    originalDangerousOpsEnv = process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR];
    delete process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR];
    executeRawSpy = vi.spyOn(prisma, '$executeRaw').mockResolvedValue(0 as never);
    queryRawSpy = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([] as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalDangerousOpsEnv === undefined) {
      delete process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR];
    } else {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = originalDangerousOpsEnv;
    }
  });

  describe('POST /database/migrations/delete', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app).post(DELETE_PATH).send(deletePayload).expect(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects authenticated non-admin users', async () => {
      const response = await request(app)
        .post(DELETE_PATH)
        .set(createAuthHeader(regularUser))
        .send(deletePayload)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects admin when dangerous ops env flag is disabled', async () => {
      const response = await request(app)
        .post(DELETE_PATH)
        .set(createAuthHeader(adminUser))
        .send(deletePayload)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Dangerous admin operations are disabled in this environment');
      expectNoSqlExposure(response.body);
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects admin when confirmation is missing', async () => {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = 'true';

      const response = await request(app)
        .post(DELETE_PATH)
        .set(createAuthHeader(adminUser))
        .send({ migrationName: deletePayload.migrationName })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Confirmation required for this operation');
      expectNoSqlExposure(response.body);
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects admin when confirmation is wrong', async () => {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = 'true';

      const response = await request(app)
        .post(DELETE_PATH)
        .set(createAuthHeader(adminUser))
        .send({ ...deletePayload, confirm: 'WRONG_CONFIRMATION' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid confirmation for this operation');
      expectNoSqlExposure(response.body);
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('allows gated admin delete and executes migration mutation path', async () => {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = 'true';
      queryRawSpy.mockResolvedValueOnce([
        { id: 'migration-row-id', migration_name: deletePayload.migrationName },
      ] as never);

      const response = await request(app)
        .post(DELETE_PATH)
        .set(createAuthHeader(adminUser))
        .send(deletePayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.deleted).toEqual([deletePayload.migrationName]);
      expect(executeRawSpy).toHaveBeenCalled();
      expect(queryRawSpy).toHaveBeenCalled();
    });
  });

  describe('POST /database/migrations/reset-baseline', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app).post(RESET_PATH).send(resetPayload).expect(401);
      expect(response.body).toHaveProperty('message', 'Access token required');
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects authenticated non-admin users', async () => {
      const response = await request(app)
        .post(RESET_PATH)
        .set(createAuthHeader(regularUser))
        .send(resetPayload)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects admin when dangerous ops env flag is disabled', async () => {
      const response = await request(app)
        .post(RESET_PATH)
        .set(createAuthHeader(adminUser))
        .send(resetPayload)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Dangerous admin operations are disabled in this environment');
      expectNoSqlExposure(response.body);
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects admin when confirmation is missing', async () => {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = 'true';

      const response = await request(app)
        .post(RESET_PATH)
        .set(createAuthHeader(adminUser))
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Confirmation required for this operation');
      expectNoSqlExposure(response.body);
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('rejects admin when confirmation is wrong', async () => {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = 'true';

      const response = await request(app)
        .post(RESET_PATH)
        .set(createAuthHeader(adminUser))
        .send({ confirm: 'WRONG_CONFIRMATION' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid confirmation for this operation');
      expectNoSqlExposure(response.body);
      expect(executeRawSpy).not.toHaveBeenCalled();
    });

    it('allows gated admin reset-baseline and executes migration mutation path', async () => {
      process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] = 'true';

      vi.spyOn(fs, 'readdirSync').mockReturnValue(['20240101_baseline'] as never);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as never);
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('SELECT 1;');

      const response = await request(app)
        .post(RESET_PATH)
        .set(createAuthHeader(adminUser))
        .send(resetPayload)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.appliedMigrations).toEqual(['20240101_baseline']);
      expect(executeRawSpy).toHaveBeenCalled();
    });
  });
});
