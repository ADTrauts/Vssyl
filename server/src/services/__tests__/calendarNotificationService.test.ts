import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import { buildInviteIcsContent, notifyReminderDue } from '../calendarNotificationService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
    handleNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('calendarNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildInviteIcsContent includes METHOD and UID', () => {
    const ics = buildInviteIcsContent({
      event: {
        id: 'evt-1',
        title: 'Standup',
        startAt: new Date('2026-06-01T10:00:00Z'),
        endAt: new Date('2026-06-01T10:30:00Z'),
      },
      attendeeEmails: ['guest@example.com'],
      method: 'REQUEST',
    });
    expect(ics).toContain('METHOD:REQUEST');
    expect(ics).toContain('UID:evt-1');
    expect(ics).toContain('guest@example.com');
  });

  it('notifyReminderDue creates calendar_reminder notification', async () => {
    await notifyReminderDue({
      recipientUserId: 'u1',
      eventId: 'evt-1',
      calendarId: 'cal-1',
      reminderId: 'rem-1',
      title: 'Standup',
      startAt: new Date('2026-06-01T10:00:00Z'),
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        type: 'calendar_reminder',
      })
    );
  });

  it('resolveCalendarMemberUserIds returns member user ids', async () => {
    const { resolveCalendarMemberUserIds } = await import('../calendarNotificationService');
    vi.spyOn(prisma.calendarMember, 'findMany').mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ] as never);

    const ids = await resolveCalendarMemberUserIds('cal-1');
    expect(ids).toEqual(['u1', 'u2']);
  });
});
