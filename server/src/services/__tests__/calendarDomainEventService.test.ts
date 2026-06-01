import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as emitters from '../../events/domainEventEmitters';
import { recordCalendarEventCreatedDomainEvent } from '../calendarDomainEventService';

describe('calendarDomainEventService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('recordCalendarEventCreatedDomainEvent delegates to emitter', () => {
    const spy = vi.spyOn(emitters, 'emitCalendarEventCreatedEvent').mockReturnValue({ id: 'e1' } as never);

    recordCalendarEventCreatedDomainEvent({
      actorUserId: 'u1',
      eventId: 'evt-1',
      calendarId: 'cal-1',
      allDay: false,
      startAt: new Date('2026-06-01T10:00:00Z'),
      endAt: new Date('2026-06-01T11:00:00Z'),
      calendar: { contextType: 'PERSONAL', contextId: 'u1' },
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'u1',
        eventId: 'evt-1',
        calendarId: 'cal-1',
      })
    );
  });
});
