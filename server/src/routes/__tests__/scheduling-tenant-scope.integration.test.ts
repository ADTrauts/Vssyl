import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { BusinessRole, type Business, type User } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth';
import { checkSchedulingModuleInstalled } from '../../middleware/schedulingFeatureGating';
import { checkSchedulingAdmin } from '../../middleware/schedulingPermissions';
import * as schedulingController from '../../controllers/schedulingController';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

/** Minimal router: avoid importing `routes/scheduling.ts` which pulls `asyncHandler` from `index.ts`. */
function createSchedulingTestApp(): express.Application {
  const router = express.Router();
  router.use(authenticateJWT);
  router.use(checkSchedulingModuleInstalled);
  router.get('/admin/schedules/:id', checkSchedulingAdmin, schedulingController.getScheduleById);
  router.post('/admin/schedules', checkSchedulingAdmin, schedulingController.createSchedule);

  const app = express();
  app.use(express.json());
  app.use('/api/scheduling', router);
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

describe('Scheduling admin — tenant scope (F-026 / F-027)', () => {
  const app = createSchedulingTestApp();
  const userIdsToCleanup: string[] = [];
  const businessIdsToCleanup: string[] = [];

  let businessA: Business;
  let businessB: Business;
  let adminOnA: User;
  let adminOnB: User;
  let scheduleInBId: string;
  let scheduleInAId: string;

  beforeAll(async () => {
    const schedulingModule = await prisma.module.findUnique({ where: { id: 'scheduling' } });
    if (!schedulingModule) {
      throw new Error(
        'Test requires Module id "scheduling" in DB (run server seed or registerBuiltInModules)'
      );
    }

    businessA = await createTestBusiness('Sched scope A');
    businessB = await createTestBusiness('Sched scope B');
    businessIdsToCleanup.push(businessA.id, businessB.id);

    adminOnA = await createTestUser({ name: 'Sched admin A' });
    adminOnB = await createTestUser({ name: 'Sched admin B' });
    userIdsToCleanup.push(adminOnA.id, adminOnB.id);

    await prisma.businessMember.createMany({
      data: [
        {
          businessId: businessA.id,
          userId: adminOnA.id,
          role: BusinessRole.ADMIN,
          isActive: true,
          canManage: true,
          canInvite: true,
          canBilling: true,
        },
        {
          businessId: businessB.id,
          userId: adminOnB.id,
          role: BusinessRole.ADMIN,
          isActive: true,
          canManage: true,
          canInvite: true,
          canBilling: true,
        },
      ],
    });

    await prisma.businessModuleInstallation.createMany({
      data: [
        { moduleId: 'scheduling', businessId: businessA.id, enabled: true },
        { moduleId: 'scheduling', businessId: businessB.id, enabled: true },
      ],
    });

    const start = new Date('2026-06-01T00:00:00.000Z');
    const end = new Date('2026-06-07T00:00:00.000Z');

    const schedB = await prisma.schedule.create({
      data: {
        businessId: businessB.id,
        name: 'Other tenant schedule',
        startDate: start,
        endDate: end,
        createdById: adminOnB.id,
        status: 'DRAFT',
      },
    });
    scheduleInBId = schedB.id;

    const schedA = await prisma.schedule.create({
      data: {
        businessId: businessA.id,
        name: 'Own tenant schedule',
        startDate: start,
        endDate: end,
        createdById: adminOnA.id,
        status: 'DRAFT',
      },
    });
    scheduleInAId = schedA.id;
  }, 60000);

  afterAll(async () => {
    await prisma.schedule.deleteMany({
      where: { businessId: { in: businessIdsToCleanup } },
    });
    await prisma.businessModuleInstallation.deleteMany({
      where: { businessId: { in: businessIdsToCleanup } },
    });
    await prisma.business.deleteMany({
      where: { id: { in: businessIdsToCleanup } },
    });
    await cleanupTestUsers(userIdsToCleanup);
  }, 60000);

  it('returns 404 when schedule id belongs to another business (IDOR blocked)', async () => {
    const res = await request(app)
      .get(`/api/scheduling/admin/schedules/${scheduleInBId}`)
      .query({ businessId: businessA.id })
      .set(createAuthHeader(adminOnA));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 200 when schedule belongs to the authorized business', async () => {
    const res = await request(app)
      .get(`/api/scheduling/admin/schedules/${scheduleInAId}`)
      .query({ businessId: businessA.id })
      .set(createAuthHeader(adminOnA));

    expect(res.status).toBe(200);
    expect(res.body.schedule?.id).toBe(scheduleInAId);
    expect(res.body.schedule?.businessId).toBe(businessA.id);
  });

  it('returns 400 when query and body businessId disagree', async () => {
    const res = await request(app)
      .post('/api/scheduling/admin/schedules')
      .query({ businessId: businessA.id })
      .set(createAuthHeader(adminOnA))
      .send({
        businessId: businessB.id,
        name: 'Mismatch',
        startDate: '2026-07-01T00:00:00.000Z',
        endDate: '2026-07-07T00:00:00.000Z',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/match/i);
  });
});
