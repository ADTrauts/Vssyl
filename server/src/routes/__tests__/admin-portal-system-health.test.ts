import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const systemHealthFixture = {
  cpu: 42,
  memory: 55,
  disk: 61,
  network: 12,
  uptime: '3d 4h 12m',
  responseTime: 18,
  activeConnections: 7,
  errorRate: 0.02,
  timestamp: new Date('2026-06-16T12:00:00.000Z'),
};

vi.mock('../../services/systemMonitoringService', () => ({
  SystemMonitoringService: {
    getSystemHealth: vi.fn(async () => systemHealthFixture),
  },
}));

describe('GET /api/admin-portal/system/health — AP-F-005 mock fallback removal', () => {
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

  it('returns deterministic health values from the monitoring service', async () => {
    const first = await request(app)
      .get('/api/admin-portal/system/health')
      .set(createAuthHeader(adminUser))
      .expect(200);

    const second = await request(app)
      .get('/api/admin-portal/system/health')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(first.body).toMatchObject({
      status: 'available',
      cpu: 42,
      memory: 55,
      disk: 61,
      network: 12,
      uptime: '3d 4h 12m',
      responseTime: 18,
    });
    expect(second.body.cpu).toBe(first.body.cpu);
    expect(second.body.memory).toBe(first.body.memory);
    expect(first.body.uptime).not.toBe('99.9%');
    expect(JSON.stringify(first.body)).not.toContain('Math.random');
  });

  it('rejects unauthenticated requests', async () => {
    await request(app).get('/api/admin-portal/system/health').expect(401);
  });

  it('rejects non-admin users', async () => {
    await request(app)
      .get('/api/admin-portal/system/health')
      .set(createAuthHeader(regularUser))
      .expect(403);
  });
});
