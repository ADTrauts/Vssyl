import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, type Business, type User } from '@prisma/client';
import businessRouter from '../business';
import orgChartRouter from '../org-chart';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import * as policyEngine from '../../auth/policyEngine';
import * as orgChartActivityService from '../../services/business/orgChartActivityService';
import * as businessActivityService from '../../services/business/businessActivityService';

function createBusinessTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/business', authenticateJWT, businessRouter);
  return app;
}

function createOrgChartTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/org-chart', orgChartRouter);
  return app;
}

async function createTestBusiness(name: string): Promise<Business> {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return prisma.business.create({
    data: {
      name,
      ein: `PE${suffix}`,
    },
  });
}

describe('Business Administration Policy Engine', () => {
  describe('org-chart mutation PE dual', () => {
    const app = createOrgChartTestApp();
    const userIdsToCleanup: string[] = [];
    const businessIdsToCleanup: string[] = [];

    let business: Business;
    let managerUser: User;
    let employeeUser: User;
    let outsiderUser: User;

    beforeAll(async () => {
      business = await createTestBusiness('PE Org Chart Business');
      businessIdsToCleanup.push(business.id);

      managerUser = await createTestUser({ name: 'PE Manager' });
      employeeUser = await createTestUser({ name: 'PE Employee' });
      outsiderUser = await createTestUser({ name: 'PE Outsider' });
      userIdsToCleanup.push(managerUser.id, employeeUser.id, outsiderUser.id);

      await prisma.businessMember.createMany({
        data: [
          {
            businessId: business.id,
            userId: managerUser.id,
            role: BusinessRole.MANAGER,
            isActive: true,
            canManage: true,
          },
          {
            businessId: business.id,
            userId: employeeUser.id,
            role: BusinessRole.EMPLOYEE,
            isActive: true,
            canManage: false,
          },
        ],
      });
    });

    afterAll(async () => {
      await prisma.business.deleteMany({ where: { id: { in: businessIdsToCleanup } } });
      await cleanupTestUsers(userIdsToCleanup);
    });

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('allows manager to create organizational tier when PE allows', async () => {
      const tierSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierCreated').mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/org-chart/tiers')
        .set(createAuthHeader(managerUser))
        .send({
          businessId: business.id,
          name: `PE Tier ${Date.now()}`,
          level: 3,
          description: 'policy test',
          defaultPermissions: [],
          defaultModules: [],
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ businessId: business.id });
      expect(tierSpy).toHaveBeenCalled();

      if (res.body.id) {
        await prisma.organizationalTier.deleteMany({ where: { id: res.body.id } });
      }
    });

    it('returns 403 for employee without manage rights (legacy + PE)', async () => {
      const tierSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierCreated').mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/org-chart/tiers')
        .set(createAuthHeader(employeeUser))
        .send({
          businessId: business.id,
          name: 'Blocked Tier',
          level: 4,
          defaultPermissions: [],
          defaultModules: [],
        });

      expect(res.status).toBe(403);
      expect(tierSpy).not.toHaveBeenCalled();
    });

    it('returns 403 for non-member (ownership failure)', async () => {
      const res = await request(app)
        .post('/api/org-chart/tiers')
        .set(createAuthHeader(outsiderUser))
        .send({
          businessId: business.id,
          name: 'Outsider Tier',
          level: 5,
          defaultPermissions: [],
          defaultModules: [],
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    it('blocks mutation when PE security deny fires after legacy passes', async () => {
      vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
        allow: false,
        reason: 'INSUFFICIENT_ROLE',
        matchedPolicy: 'orgchart_tier_write',
      });
      const tierSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierCreated').mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/org-chart/tiers')
        .set(createAuthHeader(managerUser))
        .send({
          businessId: business.id,
          name: 'PE Denied Tier',
          level: 6,
          defaultPermissions: [],
          defaultModules: [],
        });

      expect(res.status).toBe(403);
      expect(res.body).toMatchObject({
        error: 'Insufficient permissions to modify org chart',
        reason: 'INSUFFICIENT_ROLE',
      });
      expect(tierSpy).not.toHaveBeenCalled();
    });

    it('routes employee assign through orgchart:employee.assign PE action', async () => {
      const authorizeSpy = vi.spyOn(policyEngine, 'authorize');

      await request(app)
        .post('/api/org-chart/employees/validate')
        .set(createAuthHeader(managerUser))
        .send({
          businessId: business.id,
          userId: managerUser.id,
          positionId: crypto.randomUUID(),
        });

      expect(authorizeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: POLICY_ACTIONS.ORGCHART_EMPLOYEE_ASSIGN,
          scope: { businessId: business.id },
        })
      );
    });
  });

  describe('/api/business mutation PE', () => {
    let app: express.Application;
    let owner: User;
    let businessId: string;

    beforeEach(async () => {
      app = createBusinessTestApp();
      owner = await createTestUser({ name: 'PE Business Owner' });

      const business = await prisma.business.create({
        data: {
          name: 'PE Business Admin Test',
          ein: `PEBIZ${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          members: {
            create: {
              userId: owner.id,
              role: 'ADMIN',
              canManage: true,
              canInvite: true,
              canBilling: true,
            },
          },
        },
      });
      businessId = business.id;
      vi.restoreAllMocks();
    });

    afterEach(async () => {
      await prisma.businessMember.deleteMany({ where: { businessId } });
      await prisma.business.deleteMany({ where: { id: businessId } });
      await cleanupTestUsers([owner.id]);
    });

    it('allows authenticated user to create business (bootstrap PE)', async () => {
      const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
      const res = await request(app)
        .post('/api/business')
        .set(createAuthHeader(owner))
        .send({
          name: 'New PE Business',
          ein: `NEW${suffix}`,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.id).toBeDefined();

      await prisma.businessMember.deleteMany({ where: { businessId: res.body.data.id } });
      await prisma.business.deleteMany({ where: { id: res.body.data.id } });
    });

    it('blocks business update when PE security deny fires', async () => {
      vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
        allow: false,
        reason: 'INSUFFICIENT_ROLE',
      });
      const activitySpy = vi.spyOn(businessActivityService, 'recordBusinessUpdated').mockResolvedValue(undefined);

      const res = await request(app)
        .patch(`/api/business/${businessId}`)
        .set(createAuthHeader(owner))
        .send({ name: 'Should Not Update' });

      expect(res.status).toBe(403);
      expect(activitySpy).not.toHaveBeenCalled();
    });

    it('allows admin business update when PE allows (BA-1B regression)', async () => {
      const res = await request(app)
        .patch(`/api/business/${businessId}`)
        .set(createAuthHeader(owner))
        .send({ name: 'PE Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
