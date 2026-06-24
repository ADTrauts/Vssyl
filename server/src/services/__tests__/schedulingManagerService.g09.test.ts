import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import { emitModuleActivityEvent } from '../moduleActivityService';
import {
  assignShiftToEmployeeByManager,
  createShiftTemplate,
  listBusinessShiftSwapRequests,
  listOpenShiftsForManager,
  listTeamAvailability,
} from '../schedulingManagerService';
import { publishBusinessSchedule } from '../schedulingPublishService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue('evt_test'),
}));

vi.mock('../dashboardService', () => ({
  ensureBusinessDashboardForUser: vi.fn().mockResolvedValue({ id: 'dash-1' }),
}));

vi.mock('../chatSocketService', () => ({
  getChatSocketService: vi.fn().mockReturnValue({
    broadcastSchedulePublished: vi.fn(),
  }),
}));

vi.mock('../hrScheduleService', () => ({
  syncScheduleShiftsToCalendar: vi.fn().mockResolvedValue(undefined),
  syncSingleShiftToCalendar: vi.fn().mockResolvedValue(undefined),
}));

describe('schedulingManagerService (G09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listOpenShiftsForManager returns open future shifts', async () => {
    vi.spyOn(prisma.scheduleShift, 'findMany').mockResolvedValue([
      { id: 'shift-1', status: 'OPEN', isOpenShift: true },
    ] as never);

    const shifts = await listOpenShiftsForManager({
      businessId: 'biz-1',
      scope: { isAdmin: true, directReportIds: [] },
    });

    expect(shifts).toHaveLength(1);
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

  it('assignShiftToEmployeeByManager emits activity and notification', async () => {
    vi.spyOn(prisma.scheduleShift, 'findFirst')
      .mockResolvedValueOnce({
        id: 'shift-1',
        businessId: 'biz-1',
        scheduleId: 'sched-1',
        employeePositionId: null,
        startTime: new Date('2026-07-01T08:00:00Z'),
        endTime: new Date('2026-07-01T16:00:00Z'),
        status: 'OPEN',
        isOpenShift: true,
        title: 'Morning',
        schedule: { id: 'sched-1', status: 'DRAFT', businessId: 'biz-1' },
      } as never)
      .mockResolvedValueOnce(null);
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({ id: 'ep-1' } as never);
    vi.spyOn(prisma.timeOffRequest, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.scheduleShift, 'update').mockResolvedValue({
      id: 'shift-1',
      scheduleId: 'sched-1',
      title: 'Morning',
      schedule: { id: 'sched-1', status: 'DRAFT' },
    } as never);
    vi.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValue({ userId: 'emp-1' } as never);

    await assignShiftToEmployeeByManager({
      businessId: 'biz-1',
      shiftId: 'shift-1',
      employeePositionId: 'ep-1',
      actorUserId: 'mgr-1',
      scope: { isAdmin: true, directReportIds: [] },
    });

    expect(emitModuleActivityEvent).toHaveBeenCalled();
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'scheduling_shift_assigned', userId: 'emp-1' })
    );
  });

  it('assignShiftToEmployeeByManager rejects out-of-scope manager assignment', async () => {
    vi.spyOn(prisma.scheduleShift, 'findFirst').mockResolvedValue({
      id: 'shift-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      employeePositionId: null,
      startTime: new Date('2026-07-01T08:00:00Z'),
      endTime: new Date('2026-07-01T16:00:00Z'),
      status: 'OPEN',
      isOpenShift: true,
      schedule: { id: 'sched-1', status: 'DRAFT', businessId: 'biz-1' },
    } as never);

    await expect(
      assignShiftToEmployeeByManager({
        businessId: 'biz-1',
        shiftId: 'shift-1',
        employeePositionId: 'ep-outside',
        actorUserId: 'mgr-1',
        scope: { isAdmin: false, directReportIds: ['ep-1'] },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('listTeamAvailability scopes to direct reports for managers', async () => {
    vi.spyOn(prisma.employeeAvailability, 'findMany').mockResolvedValue([] as never);

    await listTeamAvailability({
      businessId: 'biz-1',
      scope: { isAdmin: false, directReportIds: ['ep-1', 'ep-2'] },
    });

    expect(prisma.employeeAvailability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeePositionId: { in: ['ep-1', 'ep-2'] },
        }),
      })
    );
  });

  it('listBusinessShiftSwapRequests queries business swaps', async () => {
    vi.spyOn(prisma.shiftSwapRequest, 'findMany').mockResolvedValue([
      { id: 'swap-1', status: 'PENDING' },
    ] as never);

    const swaps = await listBusinessShiftSwapRequests({ businessId: 'biz-1' });
    expect(swaps).toHaveLength(1);
  });

  it('createShiftTemplate maps duration minutes to end time', async () => {
    vi.spyOn(prisma.shiftTemplate, 'create').mockResolvedValue({
      id: 'tpl-1',
      name: 'Morning',
      defaultStartTime: '08:00',
      defaultEndTime: '12:00',
    } as never);

    await createShiftTemplate('biz-1', {
      name: 'Morning',
      defaultDurationMinutes: 240,
    });

    expect(prisma.shiftTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          defaultStartTime: '08:00',
          defaultEndTime: '12:00',
        }),
      })
    );
  });
});

describe('schedulingPublishService (G09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishBusinessSchedule rejects manager without team shifts', async () => {
    vi.spyOn(prisma.schedule, 'findFirst').mockResolvedValue({
      id: 'sched-1',
      businessId: 'biz-1',
      name: 'Week 1',
      shifts: [{ id: 's1', employeePositionId: 'ep-other' }],
    } as never);

    await expect(
      publishBusinessSchedule({
        scheduleId: 'sched-1',
        businessId: 'biz-1',
        actorUserId: 'mgr-1',
        managerScope: { isAdmin: false, directReportIds: ['ep-1'] },
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('publishBusinessSchedule publishes and emits activity + notification', async () => {
    vi.spyOn(prisma.schedule, 'findFirst').mockResolvedValue({
      id: 'sched-1',
      businessId: 'biz-1',
      name: 'Week 1',
      shifts: [{ id: 's1', employeePositionId: 'ep-1', startTime: new Date(), endTime: new Date() }],
    } as never);
    vi.spyOn(prisma.schedule, 'update').mockResolvedValue({
      id: 'sched-1',
      status: 'PUBLISHED',
    } as never);
    vi.spyOn(prisma.businessModuleInstallation, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValue({ userId: 'emp-1' } as never);

    const result = await publishBusinessSchedule({
      scheduleId: 'sched-1',
      businessId: 'biz-1',
      actorUserId: 'admin-1',
    });

    expect(result.schedule.status).toBe('PUBLISHED');
    expect(emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'scheduling_schedule_published' })
    );
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'scheduling_schedule_published' })
    );
  });
});
