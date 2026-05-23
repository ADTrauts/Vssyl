/**
 * User quiet hours / DND — shared for notification and ambient suggestion deferral (Phase 5E).
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

interface QuietHoursDay {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface QuietHoursSettings {
  enabled: boolean;
  days: Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    QuietHoursDay
  >;
}

export async function isDoNotDisturbEnabled(userId: string): Promise<boolean> {
  try {
    const preference = await prisma.userPreference.findUnique({
      where: { userId_key: { userId, key: 'do_not_disturb' } },
    });
    return preference?.value === 'true';
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error checking do not disturb', {
      operation: 'quiet_hours_dnd_check_error',
      error: { message: err.message },
    });
    return false;
  }
}

export async function isQuietHoursActive(userId: string): Promise<boolean> {
  try {
    const preference = await prisma.userPreference.findUnique({
      where: { userId_key: { userId, key: 'quiet_hours' } },
    });

    if (!preference?.value) return false;

    const settings = JSON.parse(preference.value) as QuietHoursSettings;
    if (!settings.enabled) return false;

    const now = new Date();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    const currentDay = dayNames[now.getDay()];
    const daySettings = settings.days[currentDay];
    if (!daySettings?.enabled) return false;

    const [startHour, startMinute] = daySettings.startTime.split(':').map(Number);
    const [endHour, endMinute] = daySettings.endTime.split(':').map(Number);
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    if (startTimeMinutes > endTimeMinutes) {
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
    }
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Error checking quiet hours', {
      operation: 'quiet_hours_check_error',
      error: { message: err.message },
    });
    return false;
  }
}

/** True when push/email (and optional outbound notification rows) should be deferred. */
export async function shouldDeferOutboundNotification(userId: string): Promise<boolean> {
  if (await isDoNotDisturbEnabled(userId)) return true;
  return isQuietHoursActive(userId);
}
