import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const businessesFixture = {
  businesses: [
    {
      id: 'biz-1',
      name: 'Acme Corp',
      tier: 'business_basic',
      industry: 'Technology',
      size: 'small',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      memberCount: 5,
      moduleCount: 3,
      owners: [{ id: 'u1', name: 'Owner', email: 'owner@acme.com' }],
      subscriptionTier: 'business_basic',
      subscriptionStatus: 'active',
      stripeCustomerId: 'cus_test',
      lastActivityAt: '2026-07-01T00:00:00.000Z',
      workspaceHealth: 'healthy' as const,
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

const emailOpsFixture = {
  configured: true,
  transportReady: true,
  provider: 'Postmark',
  smtp: { host: 'smtp.postmarkapp.com', port: 587, secure: false, user: 'token' },
  addresses: {
    from: 'Vssyl',
    fromEmail: 'noreply@vssyl.com',
    replyTo: 'support@vssyl.com',
    support: 'support@vssyl.com',
    billing: 'billing@vssyl.com',
  },
  lastSuccessfulSend: null,
  recentFailureCount: 0,
  templates: [{ id: 'welcome', name: 'Welcome', category: 'auth', description: 'New user welcome' }],
};

vi.mock('../../services/admin/adminBusinessOpsService', () => ({
  listBusinessesForOperator: vi.fn(async () => businessesFixture),
  getBusinessOperatorDetail: vi.fn(async (id: string) =>
    id === 'biz-1' ? { ...businessesFixture.businesses[0], email: null, website: null } : null,
  ),
}));

vi.mock('../../services/admin/adminEmailOpsService', () => ({
  getEmailOperationsStatus: vi.fn(async () => emailOpsFixture),
  getEmailTemplatePreview: vi.fn((id: string) =>
    id === 'welcome'
      ? {
          id: 'welcome',
          name: 'Welcome',
          category: 'auth',
          description: 'New user welcome',
          preview: { subject: 'Welcome', html: '<p>Hi</p>', text: 'Hi' },
        }
      : null,
  ),
}));

vi.mock('../../services/admin/adminOperatorSearchService', () => ({
  searchOperatorConsole: vi.fn(async (q: string) =>
    q.length >= 2
      ? [
          {
            type: 'business' as const,
            id: 'biz-1',
            label: 'Acme Corp',
            subtitle: 'Tier: business_basic',
            href: '/admin-portal/businesses?highlight=biz-1',
          },
        ]
      : [],
  ),
}));

vi.mock('../../services/admin/adminOperatorTimelineService', () => ({
  getOperatorTimeline: vi.fn(async () => [
    {
      id: 'audit-1',
      timestamp: '2026-07-05T12:00:00.000Z',
      category: 'admin' as const,
      title: 'admin action',
      href: '/admin-portal/security',
    },
  ]),
}));

describe('Admin Portal operator routes — Wave 1', () => {
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

  it('GET /businesses returns operator business list', async () => {
    const res = await request(app)
      .get('/api/admin-portal/businesses')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.businesses).toHaveLength(1);
    expect(res.body.data.businesses[0].name).toBe('Acme Corp');
  });

  it('GET /businesses/:id returns detail or 404', async () => {
    const ok = await request(app)
      .get('/api/admin-portal/businesses/biz-1')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(ok.body.data.name).toBe('Acme Corp');

    await request(app)
      .get('/api/admin-portal/businesses/missing')
      .set(createAuthHeader(adminUser))
      .expect(404);
  });

  it('GET /email-operations returns SMTP status', async () => {
    const res = await request(app)
      .get('/api/admin-portal/email-operations')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(res.body.data.provider).toBe('Postmark');
    expect(res.body.data.templates).toHaveLength(1);
  });

  it('GET /email-operations/templates/:id/preview returns preview', async () => {
    const res = await request(app)
      .get('/api/admin-portal/email-operations/templates/welcome/preview')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(res.body.data.preview.subject).toBe('Welcome');
  });

  it('GET /operator/search returns federated results', async () => {
    const res = await request(app)
      .get('/api/admin-portal/operator/search?q=acme')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.results[0].type).toBe('business');
  });

  it('GET /operator/timeline returns merged events', async () => {
    const res = await request(app)
      .get('/api/admin-portal/operator/timeline')
      .set(createAuthHeader(adminUser))
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('admin');
  });

  it('rejects non-admin on operator routes', async () => {
    await request(app)
      .get('/api/admin-portal/businesses')
      .set(createAuthHeader(regularUser))
      .expect(403);
  });
});
