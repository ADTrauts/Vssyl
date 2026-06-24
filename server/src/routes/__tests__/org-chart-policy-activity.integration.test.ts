import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, type Business, type User } from '@prisma/client';
import orgChartRouter from '../org-chart';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import * as policyEngine from '../../auth/policyEngine';
import * as orgChartActivityService from '../../services/business/orgChartActivityService';
import * as orgChartDomainEvents from '../../services/business/orgChartDomainEventService';
import * as configRealtime from '../../services/business/businessConfigRealtimeService';
import * as moduleActivity from '../../services/moduleActivityService';
import * as dashboardService from '../../services/dashboardService';

function createOrgChartTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/org-chart', orgChartRouter);
  return app;
}

describe('/api/org-chart — policy, activity, and domain events (BA-1D)', () => {
  const app = createOrgChartTestApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let business: Business;
  let manager: User;
  let employee: User;

  beforeAll(async () => {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    business = await prisma.business.create({
      data: { name: 'BA-1D Org Chart', ein: `OC1D${suffix}` },
    });
    businessIds.push(business.id);

    manager = await createTestUser({ name: 'BA-1D OC Manager' });
    employee = await createTestUser({ name: 'BA-1D OC Employee' });
    userIds.push(manager.id, employee.id);

    await prisma.businessMember.createMany({
      data: [
        {
          businessId: business.id,
          userId: manager.id,
          role: BusinessRole.MANAGER,
          isActive: true,
          canManage: true,
        },
        {
          businessId: business.id,
          userId: employee.id,
          role: BusinessRole.EMPLOYEE,
          isActive: true,
          canManage: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.employeePosition.deleteMany({ where: { businessId: business.id } });
    await prisma.position.deleteMany({ where: { businessId: business.id } });
    await prisma.department.deleteMany({ where: { businessId: business.id } });
    await prisma.organizationalTier.deleteMany({ where: { businessId: business.id } });
    await prisma.permissionSet.deleteMany({ where: { businessId: business.id } });
    await prisma.businessMember.deleteMany({ where: { businessId: { in: businessIds } } });
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await cleanupTestUsers(userIds);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-oc-1d',
    } as never);
    vi.spyOn(configRealtime, 'broadcastBusinessConfigUpdated').mockImplementation(() => undefined);
    vi.spyOn(orgChartDomainEvents, 'recordOrgChartDepartmentCreatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(orgChartDomainEvents, 'recordOrgChartEmployeeAssignedDomainEvent').mockImplementation(
      () => undefined
    );
  });

  it('tier create/update/delete emit activity and config broadcast on success', async () => {
    const createdSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierCreated');
    const updatedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierUpdated');
    const deletedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierDeleted');

    const createRes = await request(app)
      .post('/api/org-chart/tiers')
      .set(createAuthHeader(manager))
      .send({
        businessId: business.id,
        name: `Tier ${Date.now()}`,
        level: 1,
        defaultPermissions: [],
        defaultModules: [],
      });

    expect(createRes.status).toBe(201);
    expect(createdSpy).toHaveBeenCalled();
    const tierId = createRes.body.id as string;

    const updateRes = await request(app)
      .put(`/api/org-chart/tiers/${tierId}`)
      .set(createAuthHeader(manager))
      .send({ description: 'Updated tier' });

    expect(updateRes.status).toBe(200);
    expect(updatedSpy).toHaveBeenCalled();

    const deleteRes = await request(app)
      .delete(`/api/org-chart/tiers/${tierId}`)
      .set(createAuthHeader(manager));

    expect(deleteRes.status).toBe(204);
    expect(deletedSpy).toHaveBeenCalled();
    expect(configRealtime.broadcastBusinessConfigUpdated).toHaveBeenCalled();
  });

  it('department create/update/delete emit activity and domain events', async () => {
    const createdSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartDepartmentCreated');
    const updatedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartDepartmentUpdated');
    const deletedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartDepartmentDeleted');
    const domainSpy = vi.spyOn(orgChartDomainEvents, 'recordOrgChartDepartmentCreatedDomainEvent');

    const createRes = await request(app)
      .post('/api/org-chart/departments')
      .set(createAuthHeader(manager))
      .send({ businessId: business.id, name: `Dept ${Date.now()}` });

    expect(createRes.status).toBe(201);
    expect(createdSpy).toHaveBeenCalled();
    expect(domainSpy).toHaveBeenCalled();
    const departmentId = createRes.body.id as string;

    const updateRes = await request(app)
      .put(`/api/org-chart/departments/${departmentId}`)
      .set(createAuthHeader(manager))
      .send({ description: 'Updated department' });

    expect(updateRes.status).toBe(200);
    expect(updatedSpy).toHaveBeenCalled();

    const deleteRes = await request(app)
      .delete(`/api/org-chart/departments/${departmentId}`)
      .set(createAuthHeader(manager));

    expect(deleteRes.status).toBe(204);
    expect(deletedSpy).toHaveBeenCalled();
  });

  it('position create/update/delete emit activity on success', async () => {
    const tier = await prisma.organizationalTier.create({
      data: { businessId: business.id, name: 'Pos Tier', level: 2 },
    });

    const createdSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartPositionCreated');
    const updatedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartPositionUpdated');
    const deletedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartPositionDeleted');

    try {
      const createRes = await request(app)
        .post('/api/org-chart/positions')
        .set(createAuthHeader(manager))
        .send({
          businessId: business.id,
          tierId: tier.id,
          title: `Position ${Date.now()}`,
          maxOccupants: 3,
        });

      expect(createRes.status).toBe(201);
      expect(createdSpy).toHaveBeenCalled();
      const positionId = createRes.body.id as string;

      const updateRes = await request(app)
        .put(`/api/org-chart/positions/${positionId}`)
        .set(createAuthHeader(manager))
        .send({ title: 'Updated Position Title' });

      expect(updateRes.status).toBe(200);
      expect(updatedSpy).toHaveBeenCalled();

      const deleteRes = await request(app)
        .delete(`/api/org-chart/positions/${positionId}`)
        .set(createAuthHeader(manager));

      expect(deleteRes.status).toBe(204);
      expect(deletedSpy).toHaveBeenCalled();
    } finally {
      await prisma.organizationalTier.deleteMany({ where: { id: tier.id } });
    }
  });

  it('permission set create/update/delete emit activity on success', async () => {
    const createdSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartPermissionSetCreated');
    const updatedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartPermissionSetUpdated');
    const deletedSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartPermissionSetDeleted');

    const createRes = await request(app)
      .post('/api/org-chart/permission-sets')
      .set(createAuthHeader(manager))
      .send({
        businessId: business.id,
        name: `PermSet ${Date.now()}`,
        permissions: [],
        category: 'custom',
      });

    expect(createRes.status).toBe(201);
    expect(createdSpy).toHaveBeenCalled();
    const permissionSetId = createRes.body.id as string;

    const updateRes = await request(app)
      .put(`/api/org-chart/permission-sets/${permissionSetId}`)
      .set(createAuthHeader(manager))
      .send({ description: 'Updated set' });

    expect(updateRes.status).toBe(200);
    expect(updatedSpy).toHaveBeenCalled();

    const deleteRes = await request(app)
      .delete(`/api/org-chart/permission-sets/${permissionSetId}`)
      .set(createAuthHeader(manager));

    expect(deleteRes.status).toBe(204);
    expect(deletedSpy).toHaveBeenCalled();
  });

  it('structure initialize emits structure activity', async () => {
    const initSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartStructureInitialized');

    const res = await request(app)
      .post(`/api/org-chart/structure/${business.id}/default`)
      .set(createAuthHeader(manager))
      .send({ industry: 'technology' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true });
    expect(initSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: manager.id,
        businessId: business.id,
      })
    );
  });

  it('employee assign and remove emit assignment activity and domain events', async () => {
    const tier = await prisma.organizationalTier.create({
      data: { businessId: business.id, name: 'Assign Tier', level: 3 },
    });
    const position = await prisma.position.create({
      data: {
        businessId: business.id,
        tierId: tier.id,
        title: 'Assignable Role',
        maxOccupants: 5,
      },
    });

    const assignSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartEmployeeAssigned');
    const removeSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartEmployeeRemoved');
    const assignDomainSpy = vi.spyOn(orgChartDomainEvents, 'recordOrgChartEmployeeAssignedDomainEvent');

    try {
      const assignRes = await request(app)
        .post('/api/org-chart/employees/assign')
        .set(createAuthHeader(manager))
        .send({
          businessId: business.id,
          userId: employee.id,
          positionId: position.id,
          startDate: new Date().toISOString(),
        });

      expect(assignRes.status).toBe(201);
      expect(assignSpy).toHaveBeenCalled();
      expect(assignDomainSpy).toHaveBeenCalled();

      const removeRes = await request(app)
        .delete('/api/org-chart/employees/remove')
        .set(createAuthHeader(manager))
        .send({
          businessId: business.id,
          userId: employee.id,
          positionId: position.id,
        });

      expect(removeRes.status).toBe(204);
      expect(removeSpy).toHaveBeenCalled();
    } finally {
      await prisma.employeePosition.deleteMany({
        where: { businessId: business.id, userId: employee.id },
      });
      await prisma.position.deleteMany({ where: { id: position.id } });
      await prisma.organizationalTier.deleteMany({ where: { id: tier.id } });
    }
  });

  it('PE deny prevents org-chart activity emission', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });
    const tierSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierCreated');

    const res = await request(app)
      .post('/api/org-chart/tiers')
      .set(createAuthHeader(manager))
      .send({
        businessId: business.id,
        name: 'Denied Tier',
        level: 9,
        defaultPermissions: [],
        defaultModules: [],
      });

    expect(res.status).toBe(403);
    expect(tierSpy).not.toHaveBeenCalled();
  });

  it('employee without manage rights is denied before activity', async () => {
    const tierSpy = vi.spyOn(orgChartActivityService, 'recordOrgChartTierCreated');

    const res = await request(app)
      .post('/api/org-chart/tiers')
      .set(createAuthHeader(employee))
      .send({
        businessId: business.id,
        name: 'Employee Denied',
        level: 8,
        defaultPermissions: [],
        defaultModules: [],
      });

    expect(res.status).toBe(403);
    expect(tierSpy).not.toHaveBeenCalled();
  });
});
