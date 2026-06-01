import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as calendarPolicyDual from '../../auth/calendarPolicyDual';
import {
  resolveCalendarEventForVLink,
  userCanLinkCalendarEvent,
} from '../calendarVlinkAccessService';

describe('calendarVlinkAccessService', () => {
  const baseEvent = {
    id: 'evt-1',
    title: 'Standup',
    trashedAt: null,
    calendarId: 'cal-1',
    calendar: { contextType: 'BUSINESS', contextId: 'biz-1' },
    attendees: [] as Array<{ userId: string | null; email: string | null }>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPolicyDual, 'evaluateCalendarPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('allows calendar member with policy pass', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(baseEvent as never);
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue({ id: 'm1' } as never);

    const result = await resolveCalendarEventForVLink('user-1', 'evt-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Standup',
      url: '/calendar?event=evt-1',
    });
    expect(await userCanLinkCalendarEvent('user-1', 'evt-1')).toBe(true);
  });

  it('allows attendee by userId when not a calendar member', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue({
      ...baseEvent,
      attendees: [{ userId: 'user-2', email: 'guest@example.com' }],
    } as never);
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ email: 'guest@example.com' } as never);

    const result = await resolveCalendarEventForVLink('user-2', 'evt-1');

    expect(result.allowed).toBe(true);
  });

  it('denies non-member non-attendee (V_Link membership not consulted)', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(baseEvent as never);
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ email: 'outsider@example.com' } as never);

    const result = await resolveCalendarEventForVLink('outsider-1', 'evt-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
    expect(result.url).toBeUndefined();
    expect(await userCanLinkCalendarEvent('outsider-1', 'evt-1')).toBe(false);
  });

  it('denies trashed event', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue({
      ...baseEvent,
      trashedAt: new Date(),
    } as never);

    const result = await resolveCalendarEventForVLink('user-1', 'evt-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Standup',
    });
  });

  it('fails closed for permanently deleted event', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

    const result = await resolveCalendarEventForVLink('user-1', 'evt-gone');

    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });

  it('denies when policy dual blocks read', async () => {
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(baseEvent as never);
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue({ id: 'm1' } as never);
    vi.spyOn(calendarPolicyDual, 'evaluateCalendarPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'NOT_MEMBER',
    });

    const result = await resolveCalendarEventForVLink('user-1', 'evt-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });
});
