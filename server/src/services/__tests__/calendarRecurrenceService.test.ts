import { describe, expect, it } from 'vitest';
import {
  buildExceptionKeySet,
  expandRecurringEventsInRange,
  shouldApplyThisOccurrenceEdit,
} from '../calendarRecurrenceService';

describe('calendarRecurrenceService', () => {
  it('buildExceptionKeySet indexes parent occurrence starts', () => {
    const keys = buildExceptionKeySet([
      { parentEventId: 'parent-1', startAt: new Date('2026-06-02T15:00:00.000Z') },
      { parentEventId: null, startAt: new Date('2026-06-01T15:00:00.000Z') },
    ]);
    expect(keys.has('parent-1|2026-06-02T15:00:00.000Z')).toBe(true);
    expect(keys.size).toBe(1);
  });

  it('expands daily RRULE occurrences within range', () => {
    const parent = {
      id: 'series-1',
      calendarId: 'cal-1',
      title: 'Daily',
      description: null,
      location: null,
      onlineMeetingLink: null,
      startAt: new Date('2026-06-01T10:00:00.000Z'),
      endAt: new Date('2026-06-01T11:00:00.000Z'),
      allDay: false,
      timezone: 'UTC',
      status: 'CONFIRMED' as const,
      recurrenceRule: 'FREQ=DAILY;COUNT=3',
      recurrenceEndAt: null,
      parentEventId: null,
      createdById: 'user-1',
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const expanded = expandRecurringEventsInRange(
      [parent],
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-05T00:00:00.000Z'),
      new Set()
    );

    expect(expanded.length).toBe(3);
    expect(expanded[0].occurrenceStartAt).toBeInstanceOf(Date);
    expect(expanded[0].occurrenceEndAt).toBeInstanceOf(Date);
  });

  it('skips occurrences with exception keys', () => {
    const parent = {
      id: 'series-1',
      calendarId: 'cal-1',
      title: 'Daily',
      description: null,
      location: null,
      onlineMeetingLink: null,
      startAt: new Date('2026-06-01T10:00:00.000Z'),
      endAt: new Date('2026-06-01T11:00:00.000Z'),
      allDay: false,
      timezone: 'UTC',
      status: 'CONFIRMED' as const,
      recurrenceRule: 'FREQ=DAILY;COUNT=2',
      recurrenceEndAt: null,
      parentEventId: null,
      createdById: 'user-1',
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const firstOcc = new Date('2026-06-01T10:00:00.000Z');
    const exceptionKeySet = new Set([`series-1|${firstOcc.toISOString()}`]);

    const expanded = expandRecurringEventsInRange(
      [parent],
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-05T00:00:00.000Z'),
      exceptionKeySet
    );

    expect(expanded.length).toBe(1);
  });

  it('detects THIS occurrence edit mode', () => {
    expect(
      shouldApplyThisOccurrenceEdit('FREQ=WEEKLY', 'THIS', new Date('2026-06-01T10:00:00Z'))
    ).toBe(true);
    expect(shouldApplyThisOccurrenceEdit('FREQ=WEEKLY', 'SERIES', new Date())).toBe(false);
  });
});
