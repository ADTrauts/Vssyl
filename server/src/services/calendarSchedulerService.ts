import { dispatchDueReminders } from './calendarReminderService';

/** Platform cron entrypoint for calendar reminder dispatch. */
export async function runReminderDispatch(lookaheadMinutes: number = 5): Promise<void> {
  await dispatchDueReminders(lookaheadMinutes);
}
