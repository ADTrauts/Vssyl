import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const operationsFixture = {
  timestamp: '2026-07-05T12:00:00.000Z',
  overallStatus: 'healthy' as const,
  platform: {
    environment: 'test',
    cloudRunService: null,
    cloudRunRevision: null,
    nodeVersion: 'v20.0.0',
    appVersion: '1.0.0',
    uptimeSeconds: 120,
  },
  services: {
    api: { status: 'healthy' as const, uptimeSeconds: 120 },
    database: { configured: true, status: 'healthy', operatorStatus: 'healthy' as const },
    storage: { configured: true, status: 'healthy', operatorStatus: 'healthy' as const },
    stripe: { configured: true, status: 'healthy', operatorStatus: 'healthy' as const },
    email: { configured: true, status: 'healthy', operatorStatus: 'healthy' as const },
    openai: { configured: false, status: 'not_configured', operatorStatus: 'unknown' as const },
    anthropic: { configured: false, status: 'not_configured', operatorStatus: 'unknown' as const },
    realtime: { configured: true, status: 'healthy', operatorStatus: 'warning' as const },
    search: { configured: true, status: 'not_configured', operatorStatus: 'unknown' as const },
  },
  recommendations: ['All critical services are operational.'],
};

vi.mock('../../services/admin/adminPlatformOperationsService', () => ({
  getPlatformOperationsStatus: vi.fn(async () => operationsFixture),
}));

describe('GET /api/admin-portal/platform/operations-status — Wave 0', () => {
  const app = createTestApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns operator platform status for admin', async () => {
    const res = await request(app)
      .get('/api/admin-portal/platform/operations-status')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.overallStatus).toBe('healthy');
    expect(res.body.data.services.database.operatorStatus).toBe('healthy');
    expect(res.body.data.platform.environment).toBe('test');
  });

  it('rejects unauthenticated requests', async () => {
    await request(app).get('/api/admin-portal/platform/operations-status').expect(401);
  });

  it('rejects non-admin users', async () => {
    await request(app)
      .get('/api/admin-portal/platform/operations-status')
      .set(createAuthHeader(regularUser))
      .expect(403);
  });
});
