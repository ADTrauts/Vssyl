import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  listSchedulesForBusiness,
  createScheduleForBusiness,
} from '../schedulingScheduleService';
import {
  createShiftForBusiness,
  listOpenShiftsForManager,
} from '../schedulingShiftService';
import {
  createOwnAvailability,
  listTeamAvailability,
} from '../schedulingAvailabilityService';
import {
  listBusinessShiftSwapRequests,
  requestShiftSwap,
} from '../schedulingSwapService';
import {
  createShiftTemplate,
  parseShiftTemplateTimes,
} from '../schedulingTemplateService';
import { emitModuleActivityEvent } from '../moduleActivityService';

vi.mock('../moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('schedulingScheduleService (5C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listSchedulesForBusiness scopes by business and trash filter', async () => {
    vi.spyOn(prisma.schedule, 'findMany').mockResolvedValue([] as never);

    await listSchedulesForBusiness({
      businessId: 'biz-1',
      actorUserId: 'user-1',
      status: 'PUBLISHED',
    });

    expect(prisma.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          trashedAt: null,
          status: 'PUBLISHED',
        }),
      })
    );
  });

  it('createScheduleForBusiness emits activity', async () => {
    vi.spyOn(prisma.schedule, 'create').mockResolvedValue({
      id: 'sched-1',
      name: 'Week 1',
      businessId: 'biz-1',
    } as never);

    const schedule = await createScheduleForBusiness({
      businessId: 'biz-1',
      actorUserId: 'user-1',
      name: 'Week 1',
      startDate: '2026-07-01',
      endDate: '2026-07-07',
    });

    expect(schedule.id).toBe('sched-1');
    expect(emitModuleActivityEvent).toHaveBeenCalled();
  });
});

describe('schedulingShiftService (5C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createShiftForBusiness rejects missing schedule', async () => {
    vi.spyOn(prisma.schedule, 'findFirst').mockResolvedValue(null);

    await expect(
      createShiftForBusiness({
        scheduleId: 'missing',
        businessId: 'biz-1',
        actorUserId: 'user-1',
        title: 'Morning',
        startTime: '2026-07-01T08:00:00Z',
        endTime: '2026-07-01T16:00:00Z',
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('listOpenShiftsForManager filters open shifts', async () => {
    vi.spyOn(prisma.scheduleShift, 'findMany').mockResolvedValue([] as never);

    await listOpenShiftsForManager({
      businessId: 'biz-1',
      scope: { isAdmin: true, directReportIds: [] },
    });

    expect(prisma.scheduleShift.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          isOpenShift: true,
          status: 'OPEN',
        }),
      })
    );
  });
});

describe('schedulingAvailabilityService (5C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listTeamAvailability returns empty for non-admin without reports', async () => {
    const result = await listTeamAvailability({
      businessId: 'biz-1',
      scope: { isAdmin: false, directReportIds: [] },
    });
    expect(result).toEqual([]);
  });

  it('createOwnAvailability validates day of week', async () => {
    await expect(
      createOwnAvailability({
        businessId: 'biz-1',
        userId: 'user-1',
        dayOfWeek: 'INVALID',
        startTime: '09:00',
        endTime: '17:00',
        availabilityType: 'AVAILABLE',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('schedulingSwapService (5C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listBusinessShiftSwapRequests filters by status', async () => {
    vi.spyOn(prisma.shiftSwapRequest, 'findMany').mockResolvedValue([] as never);

    await listBusinessShiftSwapRequests({ businessId: 'biz-1', status: 'PENDING' });

    expect(prisma.shiftSwapRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          status: 'PENDING',
        }),
      })
    );
  });

  it('requestShiftSwap rejects non-owned shift', async () => {
    vi.spyOn(prisma.scheduleShift, 'findUnique').mockResolvedValue({
      id: 'shift-1',
      businessId: 'biz-1',
      startTime: new Date('2099-01-01'),
      employeePosition: { userId: 'other-user', user: { id: 'other-user' } },
    } as never);

    await expect(
      requestShiftSwap({
        businessId: 'biz-1',
        userId: 'user-1',
        shiftId: 'shift-1',
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('schedulingTemplateService (5C)', () => {
  it('parseShiftTemplateTimes derives end from duration', () => {
    const times = parseShiftTemplateTimes({
      defaultStartTime: '08:00',
      defaultDurationMinutes: 480,
    });
    expect(times.defaultStartTime).toBe('08:00');
    expect(times.defaultEndTime).toBe('16:00');
  });

  it('createShiftTemplate requires name', async () => {
    await expect(createShiftTemplate('biz-1', {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
