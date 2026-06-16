import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as vlinkEvents from '../../events/vlinkDomainEventEmitters';
import {
  unlinkScheduleAndShiftsFromAllVLinks,
  unlinkShiftFromAllVLinks,
} from '../schedulingVlinkLifecycleService';

describe('schedulingVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('soft-unlinks shift V_Link rows on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.SCHEDULE_SHIFT,
        entityId: 'shift-1',
        vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkShiftFromAllVLinks({
      actorUserId: 'user-1',
      shiftId: 'shift-1',
    });

    expect(count).toBe(1);
    expect(prisma.vLinkEntity.updateMany).toHaveBeenCalled();
  });

  it('unlinks schedule and all shift links before schedule purge', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany')
      .mockResolvedValueOnce([
        {
          id: 'link-shift',
          vlinkId: 'vl-1',
          entityType: VLinkEntityType.SCHEDULE_SHIFT,
          entityId: 'shift-1',
          vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'link-sched',
          vlinkId: 'vl-2',
          entityType: VLinkEntityType.SCHEDULE,
          entityId: 'sched-1',
          vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
        },
      ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkScheduleAndShiftsFromAllVLinks({
      actorUserId: 'user-1',
      scheduleId: 'sched-1',
      shiftIds: ['shift-1'],
    });

    expect(count).toBe(2);
  });
});
