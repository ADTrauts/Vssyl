import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const intelligenceFixture = {
  timestamp: '2026-07-05T15:00:00.000Z',
  overallStatus: 'healthy',
  attentionCount: 0,
  businesses: { status: 'healthy', total: 10, createdThisWeek: 2, attention: [], href: '/admin-portal/businesses' },
  email: { status: 'healthy', failuresLast24h: 0, lastSendRelative: '5 min ago', href: '/admin-portal/email-operations' },
  stripe: { status: 'healthy', mode: 'test', mrr: 1200, renewalsToday: 1, attention: [], href: '/admin-portal/billing' },
  ai: { status: 'healthy', recentFailures: 0, attention: [], href: '/admin-portal/ai-pipeline' },
};

vi.mock('../../services/admin/adminOperatorIntelligenceService', () => ({
  getOperatorIntelligenceSummary: vi.fn(async () => intelligenceFixture),
  getBusinessIntelligenceSummary: vi.fn(async () => intelligenceFixture.businesses),
  getBusinessIntelligenceDetail: vi.fn(async () => ({
    workspaceWarnings: [],
    pendingInvitations: [],
    recentMembers: [],
    recentBillingEvents: [],
    subscriptionStatus: 'active',
  })),
  getEmailIntelligence: vi.fn(async () => intelligenceFixture.email),
}));

vi.mock('../../services/admin/adminInfraIntelligenceService', () => ({
  getInfrastructureIntelligence: vi.fn(async () => ({
    overallStatus: 'healthy',
    modes: { stripe: 'test', smtp: 'configured', stripeConfigured: true },
    consoleLinks: { cloudRun: null, cloudSql: null, storage: null, gcpProject: null },
    platform: { environment: 'test', buildRevision: null },
    services: {},
    recommendations: [],
  })),
}));

vi.mock('../../services/admin/adminFeatureFlagsService', () => ({
  getOperatorFeatureFlags: vi.fn(async () => [
    { key: 'NODE_ENV', label: 'Runtime Environment', category: 'environment', source: 'environment', enabled: false, value: 'test' },
  ]),
}));

vi.mock('../../services/admin/adminOperatorTimelineService', () => ({
  getOperatorTimelineGrouped: vi.fn(async () => [
    { category: 'platform', label: 'Platform', count: 1, entries: [{ id: '1', timestamp: '2026-07-05T12:00:00.000Z', category: 'platform', title: 'test' }] },
  ]),
  getOperatorTimeline: vi.fn(async () => []),
}));

describe('Admin Portal operator intelligence — Wave 2', () => {
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

  it('GET /operator/intelligence returns summary', async () => {
    const res = await request(app)
      .get('/api/admin-portal/operator/intelligence')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.data.overallStatus).toBe('healthy');
    expect(res.body.data.businesses.total).toBe(10);
  });

  it('GET /businesses/intelligence/summary returns business signals', async () => {
    const res = await request(app)
      .get('/api/admin-portal/businesses/intelligence/summary')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.data.createdThisWeek).toBe(2);
  });

  it('GET /infrastructure/intelligence returns infra panel data', async () => {
    const res = await request(app)
      .get('/api/admin-portal/infrastructure/intelligence')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.data.modes.stripe).toBe('test');
  });

  it('GET /feature-flags returns read-only flags', async () => {
    const res = await request(app)
      .get('/api/admin-portal/feature-flags')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /operator/timeline?grouped=true returns groups', async () => {
    const res = await request(app)
      .get('/api/admin-portal/operator/timeline?grouped=true')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.data.groups).toHaveLength(1);
  });

  it('rejects non-admin', async () => {
    await request(app)
      .get('/api/admin-portal/operator/intelligence')
      .set(createAuthHeader(regularUser))
      .expect(403);
  });
});
