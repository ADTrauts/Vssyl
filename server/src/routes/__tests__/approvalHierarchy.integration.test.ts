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
import { POLICY_ACTIONS } from '../../auth/policyActions';
import * as policyEngine from '../../auth/policyEngine';
import * as approvalActivity from '../../services/business/approvalHierarchyActivityService';
import * as moduleActivity from '../../services/moduleActivityService';
import * as dashboardService from '../../services/dashboardService';
import * as configRealtime from '../../services/business/businessConfigRealtimeService';

function createOrgChartTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/org-chart', orgChartRouter);
  return app;
}

describe('/api/org-chart/approval-hierarchy — BA-4 integration', () => {
  const app = createOrgChartTestApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let business: Business;
  let manager: User;
  let employee: User;
  let employeePositionId: string;
  let managerPositionId: string;
  let positionId: string;

  beforeAll(async () => {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    business = await prisma.business.create({
      data: { name: 'BA-4 Integration AH', ein: `AHINT${suffix}` },
    });
    businessIds.push(business.id);

    manager = await createTestUser({ name: 'BA-4 Int Manager' });
    employee = await createTestUser({ name: 'BA-4 Int Employee' });
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

    const tier = await prisma.organizationalTier.create({
      data: { businessId: business.id, name: `Tier ${suffix}`, level: 1 },
    });
    const department = await prisma.department.create({
      data: {
        businessId: business.id,
        name: `Dept ${suffix}`,
      },
    });
    const managerPos = await prisma.position.create({
      data: {
        businessId: business.id,
        title: `Mgr ${suffix}`,
        tierId: tier.id,
        departmentId: department.id,
      },
    });
    const employeePos = await prisma.position.create({
      data: {
        businessId: business.id,
        title: `Emp ${suffix}`,
        tierId: tier.id,
        departmentId: department.id,
        reportsToId: managerPos.id,
      },
    });
    positionId = employeePos.id;

    const managerEp = await prisma.employeePosition.create({
      data: {
        businessId: business.id,
        userId: manager.id,
        positionId: managerPos.id,
        assignedById: manager.id,
        startDate: new Date(),
        active: true,
      },
    });
    const employeeEp = await prisma.employeePosition.create({
      data: {
        businessId: business.id,
        userId: employee.id,
        positionId: employeePos.id,
        assignedById: manager.id,
        startDate: new Date(),
        active: true,
      },
    });
    managerPositionId = managerEp.id;
    employeePositionId = employeeEp.id;
  });

  afterAll(async () => {
    await prisma.managerApprovalHierarchy.deleteMany({ where: { businessId: business.id } });
    await prisma.employeePosition.deleteMany({ where: { businessId: business.id } });
    await prisma.position.deleteMany({ where: { businessId: business.id } });
    await prisma.department.deleteMany({ where: { businessId: business.id } });
    await prisma.organizationalTier.deleteMany({ where: { businessId: business.id } });
    await prisma.businessMember.deleteMany({ where: { businessId: { in: businessIds } } });
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await cleanupTestUsers(userIds);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-ah-int',
    } as never);
    vi.spyOn(configRealtime, 'broadcastBusinessConfigUpdated').mockImplementation(() => undefined);
  });

  it('CRUD, resolve, validate, and activity on success', async () => {
    const createdSpy = vi.spyOn(approvalActivity, 'recordApprovalHierarchyCreated');
    const updatedSpy = vi.spyOn(approvalActivity, 'recordApprovalHierarchyUpdated');
    const deletedSpy = vi.spyOn(approvalActivity, 'recordApprovalHierarchyDeleted');
    const validatedSpy = vi.spyOn(approvalActivity, 'recordApprovalHierarchyValidated');

    const createRes = await request(app)
      .post('/api/org-chart/approval-hierarchy')
      .set(createAuthHeader(manager))
      .send({
        businessId: business.id,
        employeePositionId,
        managerPositionId,
        approvalTypes: ['time-off'],
      });

    expect(createRes.status).toBe(201);
    expect(createdSpy).toHaveBeenCalled();
    const hierarchyId = createRes.body.data.id as string;

    const listRes = await request(app)
      .get(`/api/org-chart/approval-hierarchy/${business.id}`)
      .set(createAuthHeader(employee));
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const detailRes = await request(app)
      .get(`/api/org-chart/approval-hierarchy/entries/${hierarchyId}`)
      .set(createAuthHeader(employee));
    expect(detailRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/org-chart/approval-hierarchy/${hierarchyId}`)
      .set(createAuthHeader(manager))
      .send({ approvalLevel: 2 });
    expect(patchRes.status).toBe(200);
    expect(updatedSpy).toHaveBeenCalled();

    const resolveRes = await request(app)
      .get(
        `/api/org-chart/approval-hierarchy/resolve/${business.id}/${employeePositionId}?approvalType=time-off`
      )
      .set(createAuthHeader(employee));
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.chain).toHaveLength(1);

    const validateRes = await request(app)
      .get(`/api/org-chart/approval-hierarchy/validate/${business.id}`)
      .set(createAuthHeader(manager));
    expect(validateRes.status).toBe(200);
    expect(validateRes.body.data.valid).toBe(true);
    expect(validatedSpy).toHaveBeenCalled();

    const deleteRes = await request(app)
      .delete(`/api/org-chart/approval-hierarchy/${hierarchyId}`)
      .set(createAuthHeader(manager));
    expect(deleteRes.status).toBe(204);
    expect(deletedSpy).toHaveBeenCalled();
  });

  it('assigns hierarchy to position with activity', async () => {
    const assignedSpy = vi.spyOn(approvalActivity, 'recordApprovalHierarchyAssigned');

    const res = await request(app)
      .post('/api/org-chart/approval-hierarchy/assign/position')
      .set(createAuthHeader(manager))
      .send({
        businessId: business.id,
        positionId,
        managerPositionId,
        approvalTypes: ['expenses'],
      });

    expect(res.status).toBe(201);
    expect(assignedSpy).toHaveBeenCalled();
    expect(res.body.data.entries.length).toBeGreaterThan(0);

    await prisma.managerApprovalHierarchy.deleteMany({ where: { businessId: business.id } });
  });
});

describe('/api/org-chart/approval-hierarchy — policy deny', () => {
  const app = createOrgChartTestApp();
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let business: Business;
  let manager: User;
  let outsider: User;

  beforeAll(async () => {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    business = await prisma.business.create({
      data: { name: 'BA-4 PE AH', ein: `AHPE${suffix}` },
    });
    businessIds.push(business.id);

    manager = await createTestUser({ name: 'BA-4 PE Manager' });
    outsider = await createTestUser({ name: 'BA-4 PE Outsider' });
    userIds.push(manager.id, outsider.id);

    await prisma.businessMember.create({
      data: {
        businessId: business.id,
        userId: manager.id,
        role: BusinessRole.MANAGER,
        isActive: true,
        canManage: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.businessMember.deleteMany({ where: { businessId: { in: businessIds } } });
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await cleanupTestUsers(userIds);
  });

  it('denies write when PE blocks and does not emit activity', async () => {
    const createdSpy = vi.spyOn(approvalActivity, 'recordApprovalHierarchyCreated');
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'INSUFFICIENT_ROLE',
    });

    const res = await request(app)
      .post('/api/org-chart/approval-hierarchy')
      .set(createAuthHeader(manager))
      .send({
        businessId: business.id,
        employeePositionId: 'ep-1',
        managerPositionId: 'mp-1',
        approvalTypes: ['time-off'],
      });

    expect(res.status).toBe(403);
    expect(createdSpy).not.toHaveBeenCalled();
  });

  it('denies read for non-member', async () => {
    const res = await request(app)
      .get(`/api/org-chart/approval-hierarchy/${business.id}`)
      .set(createAuthHeader(outsider));

    expect(res.status).toBe(403);
  });
});
