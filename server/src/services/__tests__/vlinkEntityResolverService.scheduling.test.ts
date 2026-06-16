import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as schedulingVlinkAccess from '../schedulingVlinkAccessService';
import { resolveEntityAccess, userCanLinkEntity } from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService scheduling compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates SCHEDULE resolution to schedulingVlinkAccessService', async () => {
    const spy = vi.spyOn(schedulingVlinkAccess, 'resolveScheduleForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Week 1',
      url: '/business/biz-1/workspace/scheduling?view=builder&scheduleId=sched-1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.SCHEDULE,
      'sched-1'
    );

    expect(spy).toHaveBeenCalledWith('user-1', 'sched-1');
    expect(result).toEqual({
      access: 'full',
      title: 'Week 1',
      url: '/business/biz-1/workspace/scheduling?view=builder&scheduleId=sched-1',
    });
  });

  it('returns restricted when shift access denied', async () => {
    vi.spyOn(schedulingVlinkAccess, 'resolveShiftForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Morning',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.SCHEDULE_SHIFT,
      'shift-1'
    );

    expect(result.access).toBe('restricted');
    expect(result.title).toBe('Morning');
    expect(result.url).toBeUndefined();
  });

  it('userCanLinkEntity for SCHEDULE_SHIFT uses scheduling link helper', async () => {
    vi.spyOn(schedulingVlinkAccess, 'userCanLinkShift').mockResolvedValue(false);

    await expect(
      userCanLinkEntity('outsider', VLinkEntityType.SCHEDULE_SHIFT, 'shift-1')
    ).resolves.toBe(false);
  });
});
