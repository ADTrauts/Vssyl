import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { BusinessRole, type Business, type User } from '@prisma/client';
import orgChartRouter from '../org-chart';
import { prisma } from '../../lib/prisma';
import {
  createTestAdminUser,
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createOrgChartTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/org-chart', orgChartRouter);
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

describe('Org chart routes — tenant isolation', () => {
  const app = createOrgChartTestApp();
  const userIdsToCleanup: string[] = [];
  const businessIdsToCleanup: string[] = [];

  let businessA: Business;
  let businessB: Business;
  let memberUser: User;
  let outsiderUser: User;
  let platformAdmin: User;

  beforeAll(async () => {
    businessA = await createTestBusiness('Org Chart Test A');
    businessB = await createTestBusiness('Org Chart Test B');
    businessIdsToCleanup.push(businessA.id, businessB.id);

    memberUser = await createTestUser({ name: 'Org Chart Member' });
    outsiderUser = await createTestUser({ name: 'Org Chart Outsider' });
    platformAdmin = await createTestAdminUser();
    userIdsToCleanup.push(memberUser.id, outsiderUser.id, platformAdmin.id);

    await prisma.businessMember.create({
      data: {
        businessId: businessA.id,
        userId: memberUser.id,
        role: BusinessRole.EMPLOYEE,
        isActive: true,
        canManage: false,
      },
    });

    await prisma.businessMember.create({
      data: {
        businessId: businessB.id,
        userId: outsiderUser.id,
        role: BusinessRole.EMPLOYEE,
        isActive: true,
        canManage: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.business.deleteMany({
      where: { id: { in: businessIdsToCleanup } },
    });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 401 without JWT for protected org-chart routes', async () => {
    const res = await request(app).get(`/api/org-chart/tiers/${businessA.id}`);
    expect(res.status).toBe(401);
  });

  it('allows an active business member to read org-chart data for their business', async () => {
    const res = await request(app)
      .get(`/api/org-chart/tiers/${businessA.id}`)
      .set(createAuthHeader(memberUser));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 403 when the caller is not a member of the requested business', async () => {
    const res = await request(app)
      .get(`/api/org-chart/tiers/${businessA.id}`)
      .set(createAuthHeader(outsiderUser));

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'Access denied' });
  });

  it('returns 403 when an employee tries to mutate org chart without manage rights', async () => {
    const res = await request(app)
      .post('/api/org-chart/tiers')
      .set(createAuthHeader(memberUser))
      .send({
        businessId: businessA.id,
        name: 'Should Not Create',
        level: 99,
        description: 'test',
        defaultPermissions: [],
        defaultModules: [],
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Insufficient permissions');
  });

  it('returns 403 for employee assignment validation when caller cannot manage the business', async () => {
    const res = await request(app)
      .post('/api/org-chart/employees/validate')
      .set(createAuthHeader(memberUser))
      .send({
        userId: memberUser.id,
        positionId: crypto.randomUUID(),
        businessId: businessA.id,
      });

    expect(res.status).toBe(403);
  });

  it('returns 403 for global permission catalog unless platform role is ADMIN', async () => {
    const denied = await request(app)
      .get('/api/org-chart/permissions')
      .set(createAuthHeader(memberUser));

    expect(denied.status).toBe(403);

    const allowed = await request(app)
      .get('/api/org-chart/permissions')
      .set(createAuthHeader(platformAdmin));

    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body)).toBe(true);
  });
});
