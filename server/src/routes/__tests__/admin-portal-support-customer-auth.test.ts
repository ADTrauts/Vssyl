import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../__tests__/helpers/app';
import { createTestAdminUser, createTestUser, createAuthHeader, cleanupTestUsers } from '../../__tests__/helpers/auth';
import { prisma } from '../../lib/prisma';
import type { User } from '@prisma/client';

const validTicketPayload = {
  title: 'Auth test ticket',
  description: 'Created during AP-F-001 compliance test',
  category: 'general',
  priority: 'medium',
  contactEmail: 'customer-auth-test@example.com',
  contactName: 'Test Customer',
};

describe('POST /api/admin-portal/support/tickets/customer — AP-F-001 auth enforcement', () => {
  const app = createTestApp();
  let adminUser: User;
  let regularUser: User;
  const userIdsToCleanup: string[] = [];
  const ticketIdsToCleanup: string[] = [];

  beforeAll(async () => {
    adminUser = await createTestAdminUser();
    regularUser = await createTestUser();
    userIdsToCleanup.push(adminUser.id, regularUser.id);
  });

  afterAll(async () => {
    if (ticketIdsToCleanup.length > 0) {
      await prisma.supportTicket.deleteMany({
        where: { id: { in: ticketIdsToCleanup } },
      });
    }
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('rejects unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/admin-portal/support/tickets/customer')
      .send(validTicketPayload)
      .expect(401);

    expect(response.body).toHaveProperty('message', 'Access token required');
  });

  it('rejects authenticated non-admin users', async () => {
    const response = await request(app)
      .post('/api/admin-portal/support/tickets/customer')
      .set(createAuthHeader(regularUser))
      .send(validTicketPayload)
      .expect(403);

    expect(response.body).toHaveProperty('error', 'Admin access required');
  });

  it('rejects requests with invalid token', async () => {
    const response = await request(app)
      .post('/api/admin-portal/support/tickets/customer')
      .set({ Authorization: 'Bearer invalid-token' })
      .send(validTicketPayload)
      .expect(403);

    expect(response.body).toHaveProperty('message', 'Invalid or expired token');
  });

  it('returns 400 for admin with missing required fields after auth passes', async () => {
    const response = await request(app)
      .post('/api/admin-portal/support/tickets/customer')
      .set(createAuthHeader(adminUser))
      .send({ title: 'Incomplete' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });

  it('allows authorized admin to create a customer support ticket', async () => {
    const response = await request(app)
      .post('/api/admin-portal/support/tickets/customer')
      .set(createAuthHeader(adminUser))
      .send({
        ...validTicketPayload,
        userId: regularUser.id,
        userName: regularUser.name,
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('ticketId');
    expect(response.body.data).toHaveProperty('message', 'Support ticket created successfully');

    ticketIdsToCleanup.push(response.body.data.ticketId as string);
  });
});
