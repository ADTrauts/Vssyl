import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import type { User } from '@prisma/client';

const supportContextFixture = {
  ticket: { id: 'ticket-1', title: 'Billing issue', customerId: 'user-1' },
  user: { id: 'user-1', email: 'customer@example.com', name: 'Customer', role: 'USER', lastActiveAt: null, createdAt: '2026-01-01T00:00:00.000Z' },
  businesses: [],
  workspace: null,
  subscriptions: [],
  billingStatus: null,
  pendingInvitations: [],
  invitations: [],
  recentEmails: [],
  recentActivity: [],
  recentAiActivity: [],
  recentAuditEvents: [],
  links: { user: '/admin-portal/users?highlight=user-1', businesses: '/admin-portal/businesses', billing: '/admin-portal/billing', impersonate: '/admin-portal/impersonate', activity: '/admin-portal/analytics', emailOperations: '/admin-portal/email-operations' },
};

const invitationsFixture = {
  invitations: [
    {
      id: 'inv-1',
      email: 'invite@example.com',
      role: 'EMPLOYEE',
      businessId: 'biz-1',
      businessName: 'Acme',
      status: 'pending',
      createdAt: '2026-07-01T00:00:00.000Z',
      expiresAt: '2026-08-01T00:00:00.000Z',
      acceptedAt: null,
      invitedByName: 'Owner',
      inviteUrl: 'https://vssyl.com/auth/accept-invitation?token=abc',
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

vi.mock('../../services/admin/adminSupportContextService', () => ({
  getSupportTicketContext: vi.fn(async (id: string) => (id === 'ticket-1' ? supportContextFixture : null)),
}));

vi.mock('../../services/admin/adminInvitationOpsService', () => ({
  listInvitationsForOperator: vi.fn(async () => invitationsFixture),
  getInvitationLinkForOperator: vi.fn(async (id: string) =>
    id === 'inv-1'
      ? { id: 'inv-1', email: 'invite@example.com', status: 'pending', inviteUrl: 'https://vssyl.com/auth/accept-invitation?token=abc', expiresAt: '2026-08-01T00:00:00.000Z' }
      : null,
  ),
  resendInvitationForOperator: vi.fn(async () => ({ ok: true, sent: true, invitation: { id: 'inv-1', email: 'invite@example.com', inviteUrl: 'https://vssyl.com/auth/accept-invitation?token=abc' } })),
}));

describe('Admin Portal operator workflow — Wave 3', () => {
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

  it('GET /support/tickets/:id/context returns operator context', async () => {
    const res = await request(app)
      .get('/api/admin-portal/support/tickets/ticket-1/context')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('customer@example.com');
    expect(res.body.data.links.billing).toContain('/admin-portal/billing');
  });

  it('GET /support/tickets/:id/context returns 404 for unknown ticket', async () => {
    await request(app)
      .get('/api/admin-portal/support/tickets/unknown/context')
      .set(createAuthHeader(adminUser))
      .expect(404);
  });

  it('GET /invitations lists invitations for operator', async () => {
    const res = await request(app)
      .get('/api/admin-portal/invitations?search=invite')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invitations).toHaveLength(1);
    expect(res.body.data.invitations[0].inviteUrl).toContain('accept-invitation');
  });

  it('GET /invitations/:id/link returns invite URL', async () => {
    const res = await request(app)
      .get('/api/admin-portal/invitations/inv-1/link')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.data.inviteUrl).toContain('token=');
  });

  it('POST /invitations/:id/resend resends invitation', async () => {
    const res = await request(app)
      .post('/api/admin-portal/invitations/inv-1/resend')
      .set(createAuthHeader(adminUser))
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toBe(true);
  });

  it('rejects non-admin for support context', async () => {
    await request(app)
      .get('/api/admin-portal/support/tickets/ticket-1/context')
      .set(createAuthHeader(regularUser))
      .expect(403);
  });
});
