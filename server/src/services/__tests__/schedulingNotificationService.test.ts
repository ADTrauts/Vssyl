import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import {
  notifyOpenShiftAvailable,
  notifySchedulePublished,
  notifyShiftAssigned,
  notifySwapRequested,
  notifySwapResolved,
} from '../schedulingNotificationService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('schedulingNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notifySchedulePublished uses scheduling_schedule_published and excludes actor', async () => {
    vi.spyOn(prisma.employeePosition, 'findUnique')
      .mockResolvedValueOnce({ userId: 'emp-1' } as never)
      .mockResolvedValueOnce({ userId: 'actor-1' } as never);

    await notifySchedulePublished({
      actorUserId: 'actor-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      scheduleName: 'Week 24',
      employeePositionIds: ['ep-1', 'ep-2'],
    });

    expect(NotificationService.createNotification).toHaveBeenCalledTimes(1);
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'emp-1',
        type: 'scheduling_schedule_published',
      })
    );
  });

  it('notifyShiftAssigned uses scheduling_shift_assigned for assignee', async () => {
    vi.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValue({ userId: 'emp-1' } as never);

    await notifyShiftAssigned({
      actorUserId: 'actor-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      shiftId: 'shift-1',
      shiftTitle: 'Morning shift',
      employeePositionId: 'ep-1',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'emp-1',
        type: 'scheduling_shift_assigned',
      })
    );
  });

  it('notifySwapRequested uses scheduling_swap_requested for manager', async () => {
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
      position: {
        reportsTo: {
          employeePositions: [{ userId: 'mgr-1' }],
        },
      },
    } as never);

    await notifySwapRequested({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      swapId: 'swap-1',
      shiftId: 'shift-1',
      employeePositionId: 'ep-1',
      actorName: 'Alex',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'mgr-1',
        type: 'scheduling_swap_requested',
      })
    );
  });

  it('notifySwapResolved maps approved and denied types', async () => {
    await notifySwapResolved({
      actorUserId: 'mgr-1',
      businessId: 'biz-1',
      swapId: 'swap-1',
      shiftId: 'shift-1',
      outcome: 'approved',
      recipientUserIds: ['emp-1'],
    });

    await notifySwapResolved({
      actorUserId: 'mgr-1',
      businessId: 'biz-1',
      swapId: 'swap-2',
      shiftId: 'shift-2',
      outcome: 'denied',
      recipientUserIds: ['emp-1'],
    });

    expect(NotificationService.createNotification).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'scheduling_swap_approved' })
    );
    expect(NotificationService.createNotification).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'scheduling_swap_denied' })
    );
  });

  it('notifyOpenShiftAvailable resolves active employees when recipients omitted', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { userId: 'emp-1' },
      { userId: 'emp-2' },
    ] as never);

    await notifyOpenShiftAvailable({
      actorUserId: 'mgr-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      shiftId: 'shift-1',
      shiftTitle: 'Open shift',
    });

    expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'scheduling_open_shift_available', userId: 'emp-1' })
    );
  });
});
