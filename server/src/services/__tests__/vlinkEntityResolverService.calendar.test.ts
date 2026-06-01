import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as calendarVlinkAccess from '../calendarVlinkAccessService';
import { resolveEntityAccess, userCanLinkEntity } from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService calendar compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates CALENDAR_EVENT resolution to calendarVlinkAccessService', async () => {
    const spy = vi.spyOn(calendarVlinkAccess, 'resolveCalendarEventForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Standup',
      url: '/calendar?event=evt-1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.CALENDAR_EVENT,
      'evt-1'
    );

    expect(spy).toHaveBeenCalledWith('user-1', 'evt-1');
    expect(result).toEqual({
      access: 'full',
      title: 'Standup',
      url: '/calendar?event=evt-1',
    });
  });

  it('returns restricted when calendar access denied', async () => {
    vi.spyOn(calendarVlinkAccess, 'resolveCalendarEventForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Old event',
    });

    const result = await resolveEntityAccess(
      'vlink-member-only',
      VLinkEntityType.CALENDAR_EVENT,
      'evt-1'
    );

    expect(result.access).toBe('restricted');
    expect(result.title).toBe('Old event');
    expect(result.url).toBeUndefined();
  });

  it('userCanLinkEntity for CALENDAR_EVENT uses calendar link helper', async () => {
    vi.spyOn(calendarVlinkAccess, 'userCanLinkCalendarEvent').mockResolvedValue(false);

    await expect(
      userCanLinkEntity('outsider', VLinkEntityType.CALENDAR_EVENT, 'evt-1')
    ).resolves.toBe(false);
  });
});
