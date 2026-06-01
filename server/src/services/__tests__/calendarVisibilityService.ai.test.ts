import { describe, expect, it } from 'vitest';
import { CalendarServiceError } from '../calendar/calendarErrors';
import { getAvailabilityForAI } from '../calendarVisibilityService';

describe('calendarVisibilityService AI helpers', () => {
  it('getAvailabilityForAI throws on invalid dates', async () => {
    await expect(getAvailabilityForAI('u1', 'not-a-date', '2026-06-01')).rejects.toBeInstanceOf(
      CalendarServiceError
    );
    await expect(getAvailabilityForAI('u1', 'not-a-date', '2026-06-01')).rejects.toMatchObject({
      code: 'invalid',
      status: 400,
    });
  });
});
