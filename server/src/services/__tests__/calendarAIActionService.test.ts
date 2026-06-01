import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarServiceError } from '../calendar/calendarErrors';
import * as calendarEventService from '../calendarEventService';
import * as calendarAttendeeService from '../calendarAttendeeService';
import * as calendarVisibilityService from '../calendarVisibilityService';
import { aiCreateEvent, aiRsvpEvent } from '../calendarAIActionService';

describe('calendarAIActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aiCreateEvent delegates to calendarEventService', async () => {
    vi.spyOn(calendarEventService, 'createEvent').mockResolvedValue({
      event: { id: 'evt-1', title: 'Standup' },
      calendar: { id: 'cal-1', contextType: 'PERSONAL', contextId: 'u1' },
    } as never);

    const outcome = await aiCreateEvent({
      userId: 'u1',
      calendarId: 'cal-1',
      title: 'Standup',
      startAt: '2026-06-01T10:00:00Z',
      endAt: '2026-06-01T10:30:00Z',
      attendees: ['guest@example.com'],
    });

    expect(outcome.success).toBe(true);
    expect(calendarEventService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        calendarId: 'cal-1',
        attendees: [{ email: 'guest@example.com' }],
      })
    );
  });

  it('aiCreateEvent maps CalendarServiceError to safe outcome', async () => {
    vi.spyOn(calendarEventService, 'createEvent').mockRejectedValue(
      new CalendarServiceError('Forbidden', 'forbidden', 403)
    );

    const outcome = await aiCreateEvent({
      userId: 'u1',
      calendarId: 'cal-1',
      title: 'Standup',
      startAt: '2026-06-01T10:00:00Z',
      endAt: '2026-06-01T10:30:00Z',
    });

    expect(outcome).toEqual({ success: false, error: 'Forbidden' });
  });

  it('aiRsvpEvent delegates to calendarAttendeeService', async () => {
    vi.spyOn(calendarAttendeeService, 'rsvpEvent').mockResolvedValue({ id: 'evt-1' } as never);

    const outcome = await aiRsvpEvent({
      userId: 'u1',
      eventId: 'evt-1',
      response: 'ACCEPTED',
    });

    expect(outcome.success).toBe(true);
    expect(calendarAttendeeService.rsvpEvent).toHaveBeenCalled();
  });

  it('aiCheckConflicts uses visibility service', async () => {
    const { aiCheckConflicts } = await import('../calendarAIActionService');
    vi.spyOn(calendarVisibilityService, 'checkConflicts').mockResolvedValue([] as never);

    const outcome = await aiCheckConflicts({
      userId: 'u1',
      start: '2026-06-01T10:00:00Z',
      end: '2026-06-01T11:00:00Z',
    });

    expect(outcome.success).toBe(true);
    expect(calendarVisibilityService.checkConflicts).toHaveBeenCalled();
  });
});
