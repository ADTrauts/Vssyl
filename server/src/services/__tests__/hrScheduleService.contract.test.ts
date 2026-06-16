import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import {
  addUsersToScheduleCalendar,
  initializeHrScheduleForBusiness,
  syncScheduleShiftsToCalendar,
  syncSingleShiftToCalendar,
  syncTimeOffRequestCalendar,
} from '../hrScheduleService';

describe('hrScheduleService contract (CO-07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the documented public bridge functions', () => {
    expect(typeof initializeHrScheduleForBusiness).toBe('function');
    expect(typeof addUsersToScheduleCalendar).toBe('function');
    expect(typeof syncTimeOffRequestCalendar).toBe('function');
    expect(typeof syncScheduleShiftsToCalendar).toBe('function');
    expect(typeof syncSingleShiftToCalendar).toBe('function');
  });

  it('syncTimeOffRequestCalendar returns early when request is missing', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.timeOffRequest, 'findUnique').mockResolvedValue(null);

    await syncTimeOffRequestCalendar('missing-request');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('syncScheduleShiftsToCalendar returns early when schedule is missing', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.schedule, 'findUnique').mockResolvedValue(null);

    await syncScheduleShiftsToCalendar('missing-schedule', 'biz-1');

    expect(warnSpy).toHaveBeenCalledWith(
      'Schedule not found for calendar sync',
      expect.objectContaining({ scheduleId: 'missing-schedule' })
    );
  });

  it('syncSingleShiftToCalendar returns early when shift is missing', async () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.scheduleShift, 'findUnique').mockResolvedValue(null);

    await syncSingleShiftToCalendar('missing-shift', 'biz-1');

    expect(warnSpy).toHaveBeenCalledWith(
      'Shift not found for calendar sync',
      expect.objectContaining({ shiftId: 'missing-shift' })
    );
  });

  it('syncSingleShiftToCalendar no-ops when schedule is not published', async () => {
    vi.spyOn(prisma.scheduleShift, 'findUnique').mockResolvedValue({
      id: 'shift-1',
      scheduleId: 'sched-1',
      employeePositionId: null,
      metadata: null,
      startTime: new Date(),
      endTime: new Date(),
      schedule: { id: 'sched-1', name: 'Week', businessId: 'biz-1' },
      employeePosition: null,
      position: null,
      location: null,
    } as never);
    vi.spyOn(prisma.schedule, 'findUnique').mockResolvedValue({ status: 'DRAFT' } as never);

    await expect(syncSingleShiftToCalendar('shift-1', 'biz-1')).resolves.toBeUndefined();
  });

  it('addUsersToScheduleCalendar no-ops when calendar is not provisioned', async () => {
    vi.spyOn(prisma.hRModuleSettings, 'findUnique').mockResolvedValue({ scheduleCalendarId: null } as never);

    await expect(addUsersToScheduleCalendar('biz-1', ['user-1'])).resolves.toBeUndefined();
  });
});
