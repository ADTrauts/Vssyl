import crypto from 'crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BusinessRole, type Business, type User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';
import approvalHierarchyService, {
  ApprovalHierarchyValidationError,
} from '../approvalHierarchyService';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import {
  recordApprovalHierarchyCreated,
  recordApprovalHierarchyValidated,
} from '../business/approvalHierarchyActivityService';
import * as domainEvents from '../business/approvalHierarchyDomainEventService';
import * as configRealtime from '../business/businessConfigRealtimeService';

describe('approvalHierarchyService', () => {
  const userIds: string[] = [];
  const businessIds: string[] = [];

  let business: Business;
  let managerUser: User;
  let employeeUser: User;
  let employeePositionId: string;
  let managerPositionId: string;

  beforeAll(async () => {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    business = await prisma.business.create({
      data: { name: 'BA-4 Approval Hierarchy', ein: `AH${suffix}` },
    });
    businessIds.push(business.id);

    managerUser = await createTestUser({ name: 'BA-4 Manager' });
    employeeUser = await createTestUser({ name: 'BA-4 Employee' });
    userIds.push(managerUser.id, employeeUser.id);

    const tier = await prisma.organizationalTier.create({
      data: {
        businessId: business.id,
        name: `Tier ${suffix}`,
        level: 1,
      },
    });

    const department = await prisma.department.create({
      data: {
        businessId: business.id,
        name: `Dept ${suffix}`,
      },
    });

    const managerPosition = await prisma.position.create({
      data: {
        businessId: business.id,
        title: `Manager ${suffix}`,
        tierId: tier.id,
        departmentId: department.id,
      },
    });

    const employeePosition = await prisma.position.create({
      data: {
        businessId: business.id,
        title: `Employee ${suffix}`,
        tierId: tier.id,
        departmentId: department.id,
        reportsToId: managerPosition.id,
      },
    });

    const managerEp = await prisma.employeePosition.create({
      data: {
        businessId: business.id,
        userId: managerUser.id,
        positionId: managerPosition.id,
        assignedById: managerUser.id,
        startDate: new Date(),
        active: true,
      },
    });

    const employeeEp = await prisma.employeePosition.create({
      data: {
        businessId: business.id,
        userId: employeeUser.id,
        positionId: employeePosition.id,
        assignedById: managerUser.id,
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
    await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    await cleanupTestUsers(userIds);
  });

  it('creates, updates, lists, resolves, and deletes hierarchy entries', async () => {
    const created = await approvalHierarchyService.createApprovalHierarchy({
      businessId: business.id,
      employeePositionId,
      managerPositionId,
      approvalTypes: ['time-off'],
      approvalLevel: 1,
      isPrimary: true,
    });

    expect(created.id).toBeTruthy();
    expect(created.approvalTypes).toContain('time-off');

    const listed = await approvalHierarchyService.listApprovalHierarchies(business.id, {
      employeePositionId,
    });
    expect(listed).toHaveLength(1);

    const updated = await approvalHierarchyService.updateApprovalHierarchy(created.id, {
      approvalTypes: ['time-off', 'expenses'],
      approvalLevel: 2,
    });
    expect(updated.approvalLevel).toBe(2);
    expect(updated.approvalTypes).toContain('expenses');

    const resolution = await approvalHierarchyService.resolveApprovalChain(
      business.id,
      employeePositionId,
      'time-off'
    );
    expect(resolution.chain).toHaveLength(1);
    expect(resolution.chain[0].managerPositionId).toBe(managerPositionId);

    await approvalHierarchyService.deleteApprovalHierarchy(created.id);
    const afterDelete = await approvalHierarchyService.listApprovalHierarchies(business.id);
    expect(afterDelete).toHaveLength(0);
  });

  it('rejects self-approval and missing positions', async () => {
    await expect(
      approvalHierarchyService.createApprovalHierarchy({
        businessId: business.id,
        employeePositionId,
        managerPositionId: employeePositionId,
        approvalTypes: ['time-off'],
      })
    ).rejects.toBeInstanceOf(ApprovalHierarchyValidationError);

    await expect(
      approvalHierarchyService.createApprovalHierarchy({
        businessId: business.id,
        employeePositionId: 'nonexistent',
        managerPositionId,
        approvalTypes: ['time-off'],
      })
    ).rejects.toBeInstanceOf(ApprovalHierarchyValidationError);
  });

  it('assigns to position and validates integrity', async () => {
    const employeeEp = await prisma.employeePosition.findUniqueOrThrow({
      where: { id: employeePositionId },
      select: { positionId: true },
    });

    const result = await approvalHierarchyService.assignApprovalHierarchyToPosition({
      businessId: business.id,
      positionId: employeeEp.positionId,
      managerPositionId,
      approvalTypes: ['performance-review'],
    });

    expect(result.entries.length).toBeGreaterThan(0);

    const validation = await approvalHierarchyService.validateApprovalHierarchyIntegrity(business.id);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
});

describe('approvalHierarchyActivityService', () => {
  beforeAll(() => {
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-ah',
    } as never);
    vi.spyOn(configRealtime, 'broadcastBusinessConfigUpdated').mockImplementation(() => undefined);
    vi.spyOn(domainEvents, 'recordApprovalHierarchyCreatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(domainEvents, 'recordApprovalHierarchyValidatedDomainEvent').mockImplementation(
      () => undefined
    );
  });

  it('emits activity and domain events on create and validate', async () => {
    await recordApprovalHierarchyCreated({
      actorUserId: 'user-1',
      businessId: 'biz-1',
      hierarchyId: 'hier-1',
      employeePositionId: 'ep-1',
      managerPositionId: 'mp-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'approval_hierarchy_created',
        targetType: 'approval_hierarchy',
        targetId: 'hier-1',
      })
    );
    expect(domainEvents.recordApprovalHierarchyCreatedDomainEvent).toHaveBeenCalled();

    await recordApprovalHierarchyValidated({
      actorUserId: 'user-1',
      businessId: 'biz-1',
      valid: true,
      issueCount: 0,
    });

    expect(domainEvents.recordApprovalHierarchyValidatedDomainEvent).toHaveBeenCalled();
  });
});
