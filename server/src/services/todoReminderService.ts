/**
 * Todo due-date reminders — foundation only (Phase 1D).
 *
 * **Runtime today:** Due alerts are primarily satisfied via Calendar bridge
 * (`ensureTaskCalendarEvent` in controller). No in-app `todo_due` dispatch loop exists.
 *
 * **Phase 2+:** Wire `dispatchDueReminders` from a platform cron job via `todoSchedulerService`
 * when product defines in-app reminder types in the manifest.
 */

export async function dispatchDueReminders(): Promise<{ dispatched: number }> {
  return { dispatched: 0 };
}
