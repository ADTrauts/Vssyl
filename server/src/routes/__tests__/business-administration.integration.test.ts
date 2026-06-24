import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, type Business, type User } from '@prisma/client';
import businessRouter from '../business';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import * as policyEngine from '../../auth/policyEngine';
import * as businessActivityService from '../../services/business/businessActivityService';
import * as configRealtime from '../../services/business/businessConfigRealtimeService';
import * as emailService from '../../services/emailService';
import * as moduleActivity from '../../services/moduleActivityService';
import * as dashboardService from '../../services/dashboardService';

function createBusinessTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/business', authenticateJWT, businessRouter);
  return app;
}

async function createOwnedBusiness(owner: User, name: string): Promise<Business> {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return prisma.business.create({
    data: {
      name,
      ein: `BA1D${suffix}`,
      members: {
        create: {
          userId: owner.id,
          role: BusinessRole.ADMIN,
          canManage: true,
          canInvite: true,
          canBilling: true,
        },
      },
      dashboards: {
        create: {
          userId: owner.id,
          name: `${name} Dashboard`,
        },
      },
    },
  });
}

describe('/api/business — integration contracts (BA-1D)', () => {
  const app = createBusinessTestApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let admin: User;
  let employee: User;
  let readOnlyEmployee: User;
  let outsider: User;
  let business: Business;

  beforeAll(async () => {
    admin = await createTestUser({ name: 'BA-1D Admin' });
    employee = await createTestUser({ name: 'BA-1D Employee' });
    readOnlyEmployee = await createTestUser({ name: 'BA-1D ReadOnly Employee' });
    outsider = await createTestUser({ name: 'BA-1D Outsider' });
    userIds.push(admin.id, employee.id, readOnlyEmployee.id, outsider.id);

    business = await createOwnedBusiness(admin, 'BA-1D Integration Business');
    businessIds.push(business.id);

    await prisma.businessMember.createMany({
      data: [
        {
          businessId: business.id,
          userId: employee.id,
          role: BusinessRole.EMPLOYEE,
          isActive: true,
          canManage: false,
          canInvite: false,
        },
        {
          businessId: business.id,
          userId: readOnlyEmployee.id,
          role: BusinessRole.EMPLOYEE,
          isActive: true,
          canManage: false,
          canInvite: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.businessInvitation.deleteMany({ where: { businessId: { in: businessIds } } });
    await prisma.businessMember.deleteMany({ where: { businessId: { in: businessIds } } });
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await cleanupTestUsers(userIds);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(emailService, 'sendBusinessInvitationEmail').mockResolvedValue(undefined);
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-ba-1d',
    } as never);
  });

  it('returns 401 without JWT on protected routes', async () => {
    const res = await request(app).get(`/api/business/${business.id}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Access token required');
  });

  it('POST / creates business with stable response contract', async () => {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    const createdSpy = vi.spyOn(businessActivityService, 'recordBusinessCreated').mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/business')
      .set(createAuthHeader(admin))
      .send({ name: 'BA-1D New Co', ein: `NEW${suffix}` });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: expect.any(String),
        name: 'BA-1D New Co',
      }),
    });
    expect(createdSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: admin.id,
        businessId: res.body.data.id,
        name: 'BA-1D New Co',
      })
    );

    businessIds.push(res.body.data.id);
  });

  it('GET /:id/setup-status returns setup flags for members', async () => {
    const res = await request(app)
      .get(`/api/business/${business.id}/setup-status`)
      .set(createAuthHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        orgChart: expect.any(Boolean),
        branding: expect.any(Boolean),
        modules: expect.any(Boolean),
        aiAssistant: expect.any(Boolean),
        employees: expect.any(Boolean),
      },
    });
  });

  it('PATCH /:id updates profile for admin with success contract', async () => {
    const updatedSpy = vi.spyOn(businessActivityService, 'recordBusinessUpdated').mockResolvedValue(undefined);

    const res = await request(app)
      .patch(`/api/business/${business.id}`)
      .set(createAuthHeader(admin))
      .send({ name: 'BA-1D Renamed Business' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: business.id, name: 'BA-1D Renamed Business' });
    expect(updatedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: admin.id,
        businessId: business.id,
        changedFields: ['name'],
      })
    );
  });

  it('PUT /:id updates branding and emits branding activity classification', async () => {
    const updatedSpy = vi.spyOn(businessActivityService, 'recordBusinessUpdated').mockResolvedValue(undefined);

    const res = await request(app)
      .put(`/api/business/${business.id}`)
      .set(createAuthHeader(admin))
      .send({
        branding: {
          primaryColor: '#111111',
          secondaryColor: '#222222',
          accentColor: '#333333',
          fontFamily: 'Inter',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(updatedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: business.id,
        changedFields: ['branding'],
      })
    );
  });

  it('PATCH /:id configuration fields classify as configuration update', async () => {
    const broadcastSpy = vi
      .spyOn(configRealtime, 'broadcastBusinessConfigUpdated')
      .mockImplementation(() => undefined);

    const res = await request(app)
      .patch(`/api/business/${business.id}`)
      .set(createAuthHeader(admin))
      .send({ schedulingMode: 'OFFICE' });

    expect(res.status).toBe(200);
    expect(broadcastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: business.id,
        changeType: 'configuration_updated',
      })
    );
  });

  it('POST /:businessId/invite creates invitation for admin', async () => {
    const inviteSpy = vi.spyOn(businessActivityService, 'recordBusinessMemberInvited').mockResolvedValue(undefined);
    const inviteEmail = `invite-${crypto.randomUUID()}@test.com`;

    const res = await request(app)
      .post(`/api/business/${business.id}/invite`)
      .set(createAuthHeader(admin))
      .send({ email: inviteEmail, role: 'EMPLOYEE' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        businessId: business.id,
        email: inviteEmail,
        role: 'EMPLOYEE',
      }),
    });
    expect(inviteSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: admin.id,
        businessId: business.id,
        email: inviteEmail,
      })
    );
  });

  it('PUT /:id/members/:userId updates member role', async () => {
    const memberSpy = vi.spyOn(businessActivityService, 'recordBusinessMemberUpdated').mockResolvedValue(undefined);

    const res = await request(app)
      .put(`/api/business/${business.id}/members/${employee.id}`)
      .set(createAuthHeader(admin))
      .send({ role: 'MANAGER', canManage: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(memberSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: admin.id,
        businessId: business.id,
        memberUserId: employee.id,
      })
    );
  });

  it('DELETE /:id/members/:userId removes member', async () => {
    const removable = await createTestUser({ name: 'BA-1D Removable' });
    userIds.push(removable.id);
    await prisma.businessMember.create({
      data: {
        businessId: business.id,
        userId: removable.id,
        role: BusinessRole.EMPLOYEE,
        isActive: true,
      },
    });

    const removeSpy = vi.spyOn(businessActivityService, 'recordBusinessMemberRemoved').mockResolvedValue(undefined);

    const res = await request(app)
      .delete(`/api/business/${business.id}/members/${removable.id}`)
      .set(createAuthHeader(admin));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: admin.id,
        businessId: business.id,
        memberUserId: removable.id,
      })
    );
  });

  it('returns 403 when employee lacks manage rights to update business', async () => {
    const updatedSpy = vi.spyOn(businessActivityService, 'recordBusinessUpdated').mockResolvedValue(undefined);

    const res = await request(app)
      .patch(`/api/business/${business.id}`)
      .set(createAuthHeader(readOnlyEmployee))
      .send({ name: 'Should Not Apply' });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      error: 'Insufficient permissions',
    });
    expect(updatedSpy).not.toHaveBeenCalled();
  });

  it('PE security deny blocks mutation before activity emission', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });
    const updatedSpy = vi.spyOn(businessActivityService, 'recordBusinessUpdated').mockResolvedValue(undefined);

    const res = await request(app)
      .patch(`/api/business/${business.id}`)
      .set(createAuthHeader(admin))
      .send({ name: 'PE Blocked' });

    expect(res.status).toBe(403);
    expect(updatedSpy).not.toHaveBeenCalled();
  });

  it('returns 404 for non-member on GET /:id (membership-scoped read)', async () => {
    const res = await request(app)
      .get(`/api/business/${business.id}`)
      .set(createAuthHeader(outsider));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Business not found');
  });
});
