import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import businessRouter from '../business';
import { authenticateJWT } from '../../middleware/auth';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import { prisma } from '../../lib/prisma';
import * as profileService from '../../services/business/businessProfileService';
import * as activityService from '../../services/business/businessActivityService';
import type { User } from '@prisma/client';

function createBusinessTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/business', authenticateJWT, businessRouter);
  return app;
}

describe('business activity integration', () => {
  let app: express.Application;
  let owner: User;
  let businessId: string;

  beforeEach(async () => {
    app = createBusinessTestApp();
    owner = await createTestUser({ name: 'BA Activity Owner' });

    const business = await prisma.business.create({
      data: {
        name: 'Activity Test Business',
        ein: `EIN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

    vi.spyOn(activityService, 'recordBusinessUpdated').mockResolvedValue(undefined);
    vi.spyOn(profileService, 'updateBusiness').mockImplementation(async (params: {
      actorUserId: string;
      businessId: string;
      data: { name?: string };
    }) => {
      void activityService.recordBusinessUpdated({
        actorUserId: params.actorUserId,
        businessId: params.businessId,
        changedFields: Object.keys(params.data),
      });
      return {
        id: params.businessId,
        name: params.data.name ?? 'Activity Test Business',
        members: [],
      } as never;
    });
  });

  afterEach(async () => {
    await prisma.businessMember.deleteMany({ where: { businessId } });
    await prisma.business.deleteMany({ where: { id: businessId } });
    await cleanupTestUsers([owner.id]);
    vi.restoreAllMocks();
  });

  it('PATCH /api/business/:id emits activity without changing response contract', async () => {
    const response = await request(app)
      .patch(`/api/business/${businessId}`)
      .set(createAuthHeader(owner))
      .send({ name: 'Updated Business Name' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: businessId,
      name: 'Updated Business Name',
    });

    expect(profileService.updateBusiness).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: owner.id,
        businessId,
        data: { name: 'Updated Business Name' },
      })
    );
    expect(activityService.recordBusinessUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: owner.id,
        businessId,
        changedFields: ['name'],
      })
    );
  });
});
