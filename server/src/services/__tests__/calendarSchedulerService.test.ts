import { describe, expect, it, vi } from 'vitest';
import * as calendarReminder from '../calendarReminderService';
import { runReminderDispatch } from '../calendarSchedulerService';

describe('calendarSchedulerService', () => {
  it('runReminderDispatch delegates to calendarReminderService', async () => {
    const spy = vi.spyOn(calendarReminder, 'dispatchDueReminders').mockResolvedValue(undefined);
    await runReminderDispatch(10);
    expect(spy).toHaveBeenCalledWith(10);
  });
});
