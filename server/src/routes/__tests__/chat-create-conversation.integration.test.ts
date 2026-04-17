import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { BusinessRole, type Business, type User } from '@prisma/client';
import chatRouter from '../chat';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createChatTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', authenticateJWT, chatRouter);
  return app;
}

async function createTestBusiness(name: string): Promise<Business> {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return prisma.business.create({
    data: {
      name,
      ein: `TST${suffix}`,
    },
  });
}

describe('POST /api/chat/conversations — dashboard + participant policy (F-024)', () => {
  const app = createChatTestApp();
  const userIdsToCleanup: string[] = [];
  const businessIdsToCleanup: string[] = [];

  let owner: User;
  let outsider: User;
  let colleague: User;
  let ownerPersonalDashboardId: string;
  let outsiderDashboardId: string;
  let business: Business;
  let businessDashboardId: string;
  let createdConversationId: string | null = null;

  beforeAll(async () => {
    owner = await createTestUser({ name: 'Chat F024 Owner' });
    outsider = await createTestUser({ name: 'Chat F024 Outsider' });
    colleague = await createTestUser({ name: 'Chat F024 Colleague' });
    userIdsToCleanup.push(owner.id, outsider.id, colleague.id);

    const ownerDash = await prisma.dashboard.create({
      data: { userId: owner.id, name: 'Owner personal' },
    });
    ownerPersonalDashboardId = ownerDash.id;

    const outDash = await prisma.dashboard.create({
      data: { userId: outsider.id, name: 'Outsider dash' },
    });
    outsiderDashboardId = outDash.id;

    business = await createTestBusiness('Chat F024 Biz');
    businessIdsToCleanup.push(business.id);

    await prisma.businessMember.createMany({
      data: [
        {
          businessId: business.id,
          userId: owner.id,
          role: BusinessRole.ADMIN,
          isActive: true,
          canManage: true,
          canInvite: true,
          canBilling: true,
        },
        {
          businessId: business.id,
          userId: colleague.id,
          role: BusinessRole.EMPLOYEE,
          isActive: true,
        },
      ],
    });

    const bizDash = await prisma.dashboard.create({
      data: {
        userId: owner.id,
        name: 'Work tab',
        businessId: business.id,
      },
    });
    businessDashboardId = bizDash.id;
  });

  afterAll(async () => {
    if (createdConversationId) {
      await prisma.conversationParticipant.deleteMany({
        where: { conversationId: createdConversationId },
      });
      await prisma.conversation.deleteMany({
        where: { id: createdConversationId },
      });
    }

    await prisma.dashboard.deleteMany({
      where: {
        id: {
          in: [ownerPersonalDashboardId, outsiderDashboardId, businessDashboardId],
        },
      },
    });

    await prisma.business.deleteMany({
      where: { id: { in: businessIdsToCleanup } },
    });

    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 403 when dashboardId is not owned by the caller', async () => {
    const res = await request(app)
      .post('/api/chat/conversations')
      .set(createAuthHeader(owner))
      .send({
        type: 'DIRECT',
        participantIds: [colleague.id],
        dashboardId: outsiderDashboardId,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/access denied/i);
  });

  it('returns 400 for multi-user conversation on a personal (non-tenant) dashboard', async () => {
    const res = await request(app)
      .post('/api/chat/conversations')
      .set(createAuthHeader(owner))
      .send({
        type: 'DIRECT',
        participantIds: [colleague.id],
        dashboardId: ownerPersonalDashboardId,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/personal workspace/i);
  });

  it('returns 201 when dashboard is business-scoped and all participants are active members', async () => {
    const res = await request(app)
      .post('/api/chat/conversations')
      .set(createAuthHeader(owner))
      .send({
        type: 'GROUP',
        name: 'F024 team',
        participantIds: [colleague.id],
        dashboardId: businessDashboardId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.id).toBeTruthy();
    createdConversationId = res.body.data.id as string;
  });
});
