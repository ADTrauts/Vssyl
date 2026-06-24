import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import {
  recordScheduleCreated,
  recordSchedulePublished,
  recordShiftAssigned,
  recordShiftMutationActivities,
  recordShiftSwapRequested,
} from '../schedulingActivityService';

describe('schedulingActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-1',
    } as never);
  });

  it('recordScheduleCreated emits normalized scheduling activity', async () => {
    await recordScheduleCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      name: 'Week 24',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        moduleId: 'scheduling',
        action: 'scheduling_schedule_created',
        targetType: 'schedule',
        targetId: 'sched-1',
        businessId: 'biz-1',
        dashboardId: 'dash-1',
        metadata: { name: 'Week 24' },
      })
    );
  });

  it('recordSchedulePublished includes shift count metadata', async () => {
    await recordSchedulePublished({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      shiftCount: 12,
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'scheduling_schedule_published',
        metadata: { shiftCount: 12 },
      })
    );
  });

  it('recordShiftAssigned emits assignment activity with parent schedule', async () => {
    await recordShiftAssigned({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      shiftId: 'shift-1',
      scheduleId: 'sched-1',
      employeePositionId: 'ep-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'scheduling_shift_assigned',
        targetType: 'shift',
        targetId: 'shift-1',
        parentType: 'schedule',
        parentId: 'sched-1',
        metadata: { employeePositionId: 'ep-1' },
      })
    );
  });

  it('recordShiftMutationActivities emits unassign then assign on reassignment', async () => {
    await recordShiftMutationActivities({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      shiftId: 'shift-1',
      scheduleId: 'sched-1',
      previousEmployeePositionId: 'ep-1',
      nextEmployeePositionId: 'ep-2',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledTimes(3);
    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ action: 'scheduling_shift_updated' })
    );
    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ action: 'scheduling_shift_unassigned' })
    );
    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ action: 'scheduling_shift_assigned' })
    );
  });

  it('recordShiftSwapRequested emits swap request activity', async () => {
    await recordShiftSwapRequested({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      swapId: 'swap-1',
      shiftId: 'shift-1',
      requestedToId: 'emp-2',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'scheduling_shift_swap_requested',
        targetType: 'swap',
        targetId: 'swap-1',
        parentType: 'shift',
        parentId: 'shift-1',
      })
    );
  });

  it('falls back to businessId when dashboard resolution fails', async () => {
    vi.mocked(dashboardService.ensureBusinessDashboardForUser).mockRejectedValue(
      new Error('dashboard missing')
    );

    await recordScheduleCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        dashboardId: undefined,
      })
    );
  });
});
