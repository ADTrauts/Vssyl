import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import * as configRealtime from '../business/businessConfigRealtimeService';
import * as domainEvents from '../business/approvalHierarchyDomainEventService';
import {
  recordApprovalHierarchyAssigned,
  recordApprovalHierarchyDeleted,
  recordApprovalHierarchyUpdated,
} from '../business/approvalHierarchyActivityService';
import { APPROVAL_HIERARCHY_ACTIVITY_ACTIONS } from '../business/businessActivityTaxonomy';

describe('approvalHierarchyActivityService', () => {
  beforeAll(() => {
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-ah-act',
    } as never);
    vi.spyOn(configRealtime, 'broadcastBusinessConfigUpdated').mockImplementation(() => undefined);
    vi.spyOn(domainEvents, 'recordApprovalHierarchyUpdatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(domainEvents, 'recordApprovalHierarchyDeletedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(domainEvents, 'recordApprovalHierarchyAssignedDomainEvent').mockImplementation(
      () => undefined
    );
  });

  it('emits assigned, updated, and deleted activity actions', async () => {
    await recordApprovalHierarchyAssigned({
      actorUserId: 'user-1',
      businessId: 'biz-1',
      assignmentTarget: 'department',
      targetId: 'dept-1',
      entriesCreated: 2,
      entriesUpdated: 0,
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.ASSIGNED,
      })
    );

    await recordApprovalHierarchyUpdated({
      actorUserId: 'user-1',
      businessId: 'biz-1',
      hierarchyId: 'hier-1',
      changedFields: ['approvalLevel'],
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.UPDATED,
      })
    );

    await recordApprovalHierarchyDeleted({
      actorUserId: 'user-1',
      businessId: 'biz-1',
      hierarchyId: 'hier-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: APPROVAL_HIERARCHY_ACTIVITY_ACTIONS.DELETED,
      })
    );
  });
});
