import { dispatchDueReminders } from './todoReminderService';

/**
 * Todo scheduled jobs — foundation only (Phase 1D).
 * No `registerPlatformJob` entry for todo in v1; calendar-bridge covers due-date surfacing.
 */

export async function runTodoScheduledJobs(): Promise<void> {
  await dispatchDueReminders();
}
