import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { BusinessRole, type Business, type User } from '@prisma/client';
import { authenticateJWT } from '../../middleware/auth';
import { checkWorkforceCommsModuleInstalled } from '../../middleware/workforceCommsFeatureGating';
import { checkWorkforceCommsAdmin } from '../../middleware/workforceCommsPermissions';
import * as workforceCommsController from '../../controllers/workforceCommsController';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

/** Minimal router: avoid importing `routes/workforceComms.ts` which pulls `asyncHandler` from `index.ts`. */
function createWorkforceCommsTestApp(): express.Application {
  const router = express.Router();
  router.use(authenticateJWT);
  router.use(checkWorkforceCommsModuleInstalled);
  router.get(
    '/admin/communications/:id',
    checkWorkforceCommsAdmin,
    workforceCommsController.getCommunication
  );
  router.post(
    '/admin/communications',
    checkWorkforceCommsAdmin,
    workforceCommsController.createCommunication
  );

  const app = express();
  app.use(express.json());
  app.use('/api/workforce-comms', router);
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

async function ensureWorkforceCommsModuleExists(): Promise<void> {
  const existingModule = await prisma.module.findUnique({ where: { id: 'workforce_comms' } });
  if (existingModule) return;

  let developer = await prisma.user.findFirst({ select: { id: true } });
  if (!developer) {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    developer = await prisma.user.create({
      data: {
        email: `test-wc-dev-${suffix}@example.com`,
        password: 'test-password',
        name: 'Workforce Comms Test Developer',
        role: 'ADMIN',
      },
      select: { id: true },
    });
  }

  await prisma.module.create({
    data: {
      id: 'workforce_comms',
      name: 'Workforce Communications',
      description: 'Operational workforce broadcast lifecycle for businesses',
      version: '1.0.0',
      category: 'PRODUCTIVITY',
      tags: ['workforce', 'communications', 'announcements'],
      icon: 'megaphone',
      screenshots: [],
      developerId: developer.id,
      status: 'APPROVED',
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      manifest: {
        entryPoint: '/business/[id]/admin/workforce-comms',
        permissions: ['workforce_comms:read', 'workforce_comms:write', 'workforce_comms:admin'],
        isBuiltIn: true,
      },
      dependencies: [],
      permissions: ['workforce_comms:read', 'workforce_comms:write', 'workforce_comms:admin'],
      pricingTier: 'premium',
      basePrice: 0,
      enterprisePrice: 0,
      isProprietary: true,
      revenueSplit: 0,
    },
  });
}

describe('Workforce comms admin — tenant scope', () => {
  const app = createWorkforceCommsTestApp();
  const userIdsToCleanup: string[] = [];
  const businessIdsToCleanup: string[] = [];

  let businessA: Business;
  let businessB: Business;
  let adminOnA: User;
  let adminOnB: User;
  let commInBId: string;
  let commInAId: string;

  beforeAll(async () => {
    await ensureWorkforceCommsModuleExists();

    businessA = await createTestBusiness('WC scope A');
    businessB = await createTestBusiness('WC scope B');
    businessIdsToCleanup.push(businessA.id, businessB.id);

    adminOnA = await createTestUser({ name: 'WC admin A' });
    adminOnB = await createTestUser({ name: 'WC admin B' });
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
        { moduleId: 'workforce_comms', businessId: businessA.id, enabled: true },
        { moduleId: 'workforce_comms', businessId: businessB.id, enabled: true },
      ],
    });

    const commB = await prisma.workforceCommunication.create({
      data: {
        businessId: businessB.id,
        createdById: adminOnB.id,
        title: 'Other tenant comm',
        body: 'Secret B',
        communicationType: 'ANNOUNCEMENT',
      },
    });
    commInBId = commB.id;

    const commA = await prisma.workforceCommunication.create({
      data: {
        businessId: businessA.id,
        createdById: adminOnA.id,
        title: 'Own tenant comm',
        body: 'Visible A',
        communicationType: 'ANNOUNCEMENT',
      },
    });
    commInAId = commA.id;
  }, 60000);

  afterAll(async () => {
    await prisma.workforceCommunication.deleteMany({
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

  it('returns 404 when communication id belongs to another business (IDOR blocked)', async () => {
    const res = await request(app)
      .get(`/api/workforce-comms/admin/communications/${commInBId}`)
      .query({ businessId: businessA.id })
      .set(createAuthHeader(adminOnA));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 200 when communication belongs to the authorized business', async () => {
    const res = await request(app)
      .get(`/api/workforce-comms/admin/communications/${commInAId}`)
      .query({ businessId: businessA.id })
      .set(createAuthHeader(adminOnA));

    expect(res.status).toBe(200);
    expect(res.body.communication?.id).toBe(commInAId);
    expect(res.body.communication?.businessId).toBe(businessA.id);
  });

  it('returns 400 when query and body businessId disagree', async () => {
    const res = await request(app)
      .post('/api/workforce-comms/admin/communications')
      .query({ businessId: businessA.id })
      .set(createAuthHeader(adminOnA))
      .send({
        businessId: businessB.id,
        title: 'Mismatch',
        body: 'Body',
        communicationType: 'ANNOUNCEMENT',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/match/i);
  });
});
