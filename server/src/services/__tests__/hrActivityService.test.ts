import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import {
  recordAttendanceExceptionCreated,
  recordEmployeeCreated,
  recordEmployeeTerminated,
  recordOnboardingCompleted,
  recordOnboardingCreated,
  recordPtoApproved,
  recordPtoDenied,
  recordPtoRequested,
} from '../hrActivityService';

describe('hrActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue(undefined);
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-hr-1',
    } as never);
  });

  it('recordEmployeeCreated emits hr employee activity', async () => {
    await recordEmployeeCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      employeeHrProfileId: 'profile-1',
      employeePositionId: 'ep-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'hr',
        action: 'hr_employee_created',
        targetType: 'employee',
        targetId: 'profile-1',
        parentType: 'employee_position',
        parentId: 'ep-1',
        businessId: 'biz-1',
        dashboardId: 'dash-hr-1',
      })
    );
  });

  it('recordEmployeeTerminated includes termination metadata', async () => {
    await recordEmployeeTerminated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      employeeHrProfileId: 'profile-1',
      employeePositionId: 'ep-1',
      terminationDate: '2026-06-01T00:00:00.000Z',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr_employee_terminated',
        metadata: { terminationDate: '2026-06-01T00:00:00.000Z' },
      })
    );
  });

  it('recordOnboardingCreated emits onboarding journey activity', async () => {
    await recordOnboardingCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      journeyId: 'journey-1',
      employeeHrProfileId: 'profile-1',
      templateId: 'template-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr_onboarding_created',
        targetType: 'onboarding',
        targetId: 'journey-1',
      })
    );
  });

  it('recordOnboardingCompleted emits journey completion activity', async () => {
    await recordOnboardingCompleted({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      journeyId: 'journey-1',
      employeeHrProfileId: 'profile-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr_onboarding_completed',
        targetId: 'journey-1',
      })
    );
  });

  it('recordPtoRequested emits pto request activity', async () => {
    await recordPtoRequested({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      timeOffRequestId: 'tor-1',
      employeePositionId: 'ep-1',
      type: 'PTO',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr_pto_requested',
        targetType: 'time_off',
        targetId: 'tor-1',
        metadata: { type: 'PTO' },
      })
    );
  });

  it('recordPtoApproved and recordPtoDenied emit decision activities', async () => {
    await recordPtoApproved({
      actorUserId: 'mgr-1',
      businessId: 'biz-1',
      timeOffRequestId: 'tor-1',
      employeePositionId: 'ep-1',
    });
    await recordPtoDenied({
      actorUserId: 'mgr-1',
      businessId: 'biz-1',
      timeOffRequestId: 'tor-2',
      employeePositionId: 'ep-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ action: 'hr_pto_approved' })
    );
    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ action: 'hr_pto_denied' })
    );
  });

  it('recordAttendanceExceptionCreated emits attendance exception activity', async () => {
    await recordAttendanceExceptionCreated({
      actorUserId: 'system-1',
      businessId: 'biz-1',
      exceptionId: 'exc-1',
      employeePositionId: 'ep-1',
      type: 'MISSING_PUNCH',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'hr_attendance_exception_created',
        targetType: 'attendance_exception',
        targetId: 'exc-1',
        metadata: { type: 'MISSING_PUNCH' },
      })
    );
  });
});
