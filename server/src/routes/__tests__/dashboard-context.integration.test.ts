import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import type { Business, User } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth';
import * as dashboardController from '../../controllers/dashboardController';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import { BusinessRole } from '@prisma/client';

function createDashboardTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.post('/api/dashboard', authenticateJWT, (req, res, next) => {
    void dashboardController.createDashboard(req, res, next);
  });
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

describe('Dashboard create — context membership', () => {
  const app = createDashboardTestApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let outsider: User;
  let businessA: Business;

  beforeAll(async () => {
    outsider = await createTestUser({ name: 'Dash Outsider' });
    userIds.push(outsider.id);

    businessA = await createTestBusiness('Dashboard Context A');
    businessIds.push(businessA.id);
  });

  afterAll(async () => {
    const dashboards = await prisma.dashboard.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const dashIds = dashboards.map(d => d.id);

    if (dashIds.length > 0) {
      const convIds = (
        await prisma.conversation.findMany({
          where: { dashboardId: { in: dashIds } },
          select: { id: true },
        })
      ).map(c => c.id);
      if (convIds.length > 0) {
        await prisma.conversationParticipant.deleteMany({
          where: { conversationId: { in: convIds } },
        });
        await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
      }
      await prisma.folder.deleteMany({ where: { dashboardId: { in: dashIds } } });
      await prisma.dashboard.deleteMany({ where: { id: { in: dashIds } } });
    }

    const bizCalIds = (
      await prisma.calendar.findMany({
        where: { contextType: 'BUSINESS', contextId: { in: businessIds } },
        select: { id: true },
      })
    ).map(c => c.id);
    if (bizCalIds.length > 0) {
      await prisma.event.deleteMany({ where: { calendarId: { in: bizCalIds } } });
      await prisma.calendarMember.deleteMany({ where: { calendarId: { in: bizCalIds } } });
      await prisma.calendar.deleteMany({ where: { id: { in: bizCalIds } } });
    }

    await prisma.business.deleteMany({
      where: { id: { in: businessIds } },
    });

    await prisma.folder.deleteMany({ where: { userId: { in: userIds } } });
    await cleanupTestUsers(userIds);
  });

  it('returns 403 when businessId is set but user is not an active member', async () => {
    const res = await request(app)
      .post('/api/dashboard')
      .set(createAuthHeader(outsider))
      .send({
        name: 'Should not create',
        businessId: businessA.id,
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/business/i);
  });

  it('returns 400 when more than one context id is sent', async () => {
    const res = await request(app)
      .post('/api/dashboard')
      .set(createAuthHeader(outsider))
      .send({
        name: 'Bad request',
        businessId: businessA.id,
        householdId: crypto.randomUUID(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at most one/i);
  });

  it('returns 201 when user is an active business member', async () => {
    const member = await createTestUser({ name: 'Dash Member' });
    userIds.push(member.id);

    await prisma.businessMember.create({
      data: {
        businessId: businessA.id,
        userId: member.id,
        role: BusinessRole.EMPLOYEE,
        isActive: true,
        canManage: false,
      },
    });

    try {
      const res = await request(app)
        .post('/api/dashboard')
        .set(createAuthHeader(member))
        .send({
          name: 'Workspace',
          businessId: businessA.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.dashboard).toBeDefined();
      expect(res.body.dashboard.businessId).toBe(businessA.id);
    } finally {
      await prisma.dashboard.deleteMany({
        where: { userId: member.id, businessId: businessA.id },
      });
      await prisma.businessMember.deleteMany({
        where: { businessId: businessA.id, userId: member.id },
      });
    }
  });
});
