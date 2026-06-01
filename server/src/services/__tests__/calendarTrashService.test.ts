import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../calendarVlinkLifecycleService', () => ({
  unlinkCalendarEventFromAllVLinks: vi.fn().mockResolvedValue(0),
}));

import { prisma } from '../../lib/prisma';
import * as calendarPermission from '../calendarPermissionService';
import * as calendarActivity from '../calendarActivityService';
import * as calendarDomain from '../calendarDomainEventService';
import * as calendarNotification from '../calendarNotificationService';
import * as calendarRealtime from '../calendarRealtimeService';
import { unlinkCalendarEventFromAllVLinks } from '../calendarVlinkLifecycleService';
import {
  CalendarTrashError,
  emptyCalendarTrash,
  listTrashedCalendarEventsForGlobalTrash,
  permanentlyDeleteCalendarEvent,
  restoreCalendarEvent,
  softTrashCalendarEvent,
} from '../calendarTrashService';
import { CalendarServiceError } from '../calendar/calendarErrors';

describe('calendarTrashService', () => {
  const calendarContext = {
    id: 'cal-1',
    contextType: 'PERSONAL',
    contextId: 'user-1',
    defaultReminderMinutes: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(calendarPermission, 'getCalendarForWrite').mockResolvedValue(calendarContext as never);
    vi.spyOn(calendarNotification, 'resolveCalendarMemberUserIds').mockResolvedValue(['u1', 'u2']);
    vi.spyOn(calendarRealtime, 'broadcastCalendarEventDeleted').mockImplementation(() => undefined);
    vi.spyOn(calendarRealtime, 'broadcastCalendarEventUpdated').mockImplementation(() => undefined);
    vi.spyOn(calendarActivity, 'recordEventTrashed').mockResolvedValue(undefined);
    vi.spyOn(calendarActivity, 'recordEventRestored').mockResolvedValue(undefined);
    vi.spyOn(calendarActivity, 'recordEventPermanentlyDeleted').mockResolvedValue(undefined);
    vi.spyOn(calendarDomain, 'recordCalendarEventTrashedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(calendarDomain, 'recordCalendarEventRestoredDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(calendarDomain, 'recordCalendarEventPermanentlyDeletedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(calendarNotification, 'sendEventCanceledEmails').mockResolvedValue(undefined);
    vi.mocked(unlinkCalendarEventFromAllVLinks).mockResolvedValue(0);
  });

  it('soft trash sets trashedAt and emits side effects', async () => {
    vi.spyOn(prisma.event, 'findFirst').mockResolvedValue({
      id: 'evt-1',
      calendarId: 'cal-1',
      title: 'Meeting',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 1 } as never);

    const result = await softTrashCalendarEvent({ userId: 'user-1', eventId: 'evt-1' });

    expect(result).toEqual({ id: 'evt-1', calendarId: 'cal-1', title: 'Meeting' });
    expect(calendarActivity.recordEventTrashed).toHaveBeenCalled();
    expect(calendarDomain.recordCalendarEventTrashedDomainEvent).toHaveBeenCalled();
    expect(calendarNotification.sendEventCanceledEmails).toHaveBeenCalledWith({ eventId: 'evt-1' });
    expect(calendarRealtime.broadcastCalendarEventDeleted).toHaveBeenCalledWith(['u1', 'u2'], 'evt-1');
  });

  it('soft trash throws not_found for missing event', async () => {
    vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(null);

    await expect(
      softTrashCalendarEvent({ userId: 'user-1', eventId: 'missing' })
    ).rejects.toBeInstanceOf(CalendarTrashError);
  });

  it('soft trash maps forbidden write access', async () => {
    vi.spyOn(prisma.event, 'findFirst').mockResolvedValue({
      id: 'evt-1',
      calendarId: 'cal-1',
      title: 'Meeting',
    } as never);
    vi.spyOn(calendarPermission, 'getCalendarForWrite').mockRejectedValue(
      new CalendarServiceError('Forbidden', 'forbidden', 403)
    );

    await expect(
      softTrashCalendarEvent({ userId: 'user-1', eventId: 'evt-1' })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('restore clears trashedAt and broadcasts update', async () => {
    vi.spyOn(prisma.event, 'findFirst').mockResolvedValue({
      id: 'evt-1',
      calendarId: 'cal-1',
      trashedAt: new Date(),
    } as never);
    vi.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 1 } as never);
    vi.spyOn(prisma.event, 'findUnique').mockResolvedValue({
      id: 'evt-1',
      calendarId: 'cal-1',
      title: 'Meeting',
      attendees: [],
      reminders: [],
      attachments: [],
    } as never);

    const restored = await restoreCalendarEvent({ userId: 'user-1', eventId: 'evt-1' });

    expect(restored).toBe(true);
    expect(calendarActivity.recordEventRestored).toHaveBeenCalled();
    expect(calendarRealtime.broadcastCalendarEventUpdated).toHaveBeenCalled();
  });

  it('restore returns false when event not in trash', async () => {
    vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(null);

    await expect(
      restoreCalendarEvent({ userId: 'user-1', eventId: 'evt-1' })
    ).resolves.toBe(false);
  });

  it('permanent delete removes trashed event', async () => {
    vi.spyOn(prisma.event, 'findFirst').mockResolvedValue({
      id: 'evt-1',
      calendarId: 'cal-1',
      trashedAt: new Date(),
    } as never);
    vi.spyOn(prisma.event, 'deleteMany').mockResolvedValue({ count: 1 } as never);

    const deleted = await permanentlyDeleteCalendarEvent({ userId: 'user-1', eventId: 'evt-1' });

    expect(deleted).toBe(true);
    expect(calendarActivity.recordEventPermanentlyDeleted).toHaveBeenCalled();
    expect(calendarDomain.recordCalendarEventPermanentlyDeletedDomainEvent).toHaveBeenCalled();
    expect(unlinkCalendarEventFromAllVLinks).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      eventId: 'evt-1',
    });
  });

  it('listTrashedCalendarEventsForGlobalTrash returns mapped items', async () => {
    vi.spyOn(prisma.event, 'findMany').mockResolvedValue([
      {
        id: 'evt-1',
        title: 'Standup',
        trashedAt: new Date('2026-05-01'),
        calendar: { name: 'Work' },
      },
    ] as never);

    const items = await listTrashedCalendarEventsForGlobalTrash('user-1');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'evt-1',
      type: 'event',
      moduleId: 'calendar',
      metadata: { calendarName: 'Work' },
    });
  });

  it('emptyCalendarTrash permanently deletes accessible trashed events', async () => {
    vi.spyOn(prisma.event, 'findMany').mockResolvedValue([{ id: 'evt-1' }, { id: 'evt-2' }] as never);
    vi.spyOn(prisma.event, 'findFirst')
      .mockResolvedValueOnce({ id: 'evt-1', calendarId: 'cal-1', trashedAt: new Date() } as never)
      .mockResolvedValueOnce({ id: 'evt-2', calendarId: 'cal-1', trashedAt: new Date() } as never);
    vi.spyOn(prisma.event, 'deleteMany').mockResolvedValue({ count: 1 } as never);

    const count = await emptyCalendarTrash({ userId: 'user-1' });

    expect(count).toBe(2);
  });
});
