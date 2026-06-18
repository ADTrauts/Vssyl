import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import * as orgChartDomainEvents from '../business/orgChartDomainEventService';
import * as configRealtime from '../business/businessConfigRealtimeService';
import {
  recordOrgChartDepartmentCreated,
  recordOrgChartPositionUpdated,
  recordOrgChartEmployeeAssigned,
} from '../business/orgChartActivityService';

describe('orgChartActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-oc-1',
    } as never);
    vi.spyOn(orgChartDomainEvents, 'recordOrgChartDepartmentCreatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(orgChartDomainEvents, 'recordOrgChartPositionUpdatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(orgChartDomainEvents, 'recordOrgChartManagerAssignedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(orgChartDomainEvents, 'recordOrgChartEmployeeAssignedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(configRealtime, 'broadcastBusinessConfigUpdated').mockImplementation(() => undefined);
  });

  it('recordOrgChartDepartmentCreated emits org_chart activity', async () => {
    await recordOrgChartDepartmentCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      departmentId: 'dept-1',
      name: 'Engineering',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'org_chart',
        action: 'org_chart_department_created',
        targetType: 'department',
        targetId: 'dept-1',
        businessId: 'biz-1',
      })
    );
    expect(orgChartDomainEvents.recordOrgChartDepartmentCreatedDomainEvent).toHaveBeenCalled();
    expect(configRealtime.broadcastBusinessConfigUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ changeType: 'org_structure_updated' })
    );
  });

  it('recordOrgChartPositionUpdated emits manager assignment when reportsToId changes', async () => {
    await recordOrgChartPositionUpdated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      positionId: 'pos-1',
      changedFields: ['reportsToId'],
      reportsToId: 'pos-manager',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'org_chart_position_updated' })
    );
    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'org_chart_manager_assigned' })
    );
    expect(orgChartDomainEvents.recordOrgChartManagerAssignedDomainEvent).toHaveBeenCalled();
  });

  it('recordOrgChartEmployeeAssigned emits assignment activity and domain event', async () => {
    await recordOrgChartEmployeeAssigned({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      assignmentId: 'ep-1',
      userId: 'user-1',
      positionId: 'pos-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'org_chart_employee_assigned',
        targetType: 'employee_position',
        targetId: 'ep-1',
      })
    );
    expect(orgChartDomainEvents.recordOrgChartEmployeeAssignedDomainEvent).toHaveBeenCalled();
  });
});
