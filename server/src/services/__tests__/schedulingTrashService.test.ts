import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../chatSocketService', () => ({
  getChatSocketService: vi.fn(() => ({
    broadcastShiftDeleted: vi.fn(),
  })),
}));

vi.mock('../../auth/schedulingPolicyDual', () => ({
  evaluateSchedulingPolicyDual: vi.fn().mockResolvedValue({ blocked: false }),
}));

import { BusinessRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as schedulingActivity from '../schedulingActivityService';
import { evaluateSchedulingPolicyDual } from '../../auth/schedulingPolicyDual';
import {
  permanentlyDeleteSchedule,
  restoreSchedule,
  SchedulingTrashError,
  softTrashSchedule,
  softTrashShift,
} from '../schedulingTrashService';

describe('schedulingTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(schedulingActivity, 'recordScheduleTrashed').mockResolvedValue(undefined);
    vi.spyOn(schedulingActivity, 'recordScheduleRestored').mockResolvedValue(undefined);
    vi.spyOn(schedulingActivity, 'recordSchedulePurged').mockResolvedValue(undefined);
    vi.spyOn(schedulingActivity, 'recordShiftTrashed').mockResolvedValue(undefined);
    vi.mocked(evaluateSchedulingPolicyDual).mockResolvedValue({ blocked: false });
  });

  it('soft trash sets trashedAt and cascades shifts', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.schedule, 'findFirst').mockResolvedValue({
      id: 'sched-1',
      name: 'Week 12',
      businessId: 'biz-1',
      status: 'DRAFT',
      shifts: [{ id: 'shift-1', metadata: null }],
    } as never);
    vi.spyOn(prisma.schedule, 'updateMany').mockResolvedValue({ count: 1 } as never);
    vi.spyOn(prisma.scheduleShift, 'updateMany').mockResolvedValue({ count: 1 } as never);

    const result = await softTrashSchedule({
      userId: 'user-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
    });

    expect(result).toEqual({ id: 'sched-1', name: 'Week 12' });
    expect(schedulingActivity.recordScheduleTrashed).toHaveBeenCalled();
    expect(prisma.scheduleShift.updateMany).toHaveBeenCalled();
  });

  it('soft trash throws not_found for missing schedule', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.schedule, 'findFirst').mockResolvedValue(null);

    await expect(
      softTrashSchedule({ userId: 'user-1', businessId: 'biz-1', scheduleId: 'missing' })
    ).rejects.toBeInstanceOf(SchedulingTrashError);
  });

  it('restore clears trashedAt', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.schedule, 'updateMany').mockResolvedValue({ count: 1 } as never);

    const restored = await restoreSchedule({
      userId: 'user-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
    });

    expect(restored).toBe(true);
    expect(schedulingActivity.recordScheduleRestored).toHaveBeenCalled();
  });

  it('purge requires trashed state', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.schedule, 'findFirst').mockResolvedValue(null);

    const purged = await permanentlyDeleteSchedule({
      userId: 'user-1',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
    });

    expect(purged).toBe(false);
  });

  it('soft trash shift emits activity', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.scheduleShift, 'findFirst').mockResolvedValue({
      id: 'shift-1',
      scheduleId: 'sched-1',
    } as never);
    vi.spyOn(prisma.scheduleShift, 'updateMany').mockResolvedValue({ count: 1 } as never);

    await softTrashShift({
      userId: 'user-1',
      businessId: 'biz-1',
      shiftId: 'shift-1',
    });

    expect(schedulingActivity.recordShiftTrashed).toHaveBeenCalled();
  });
});
