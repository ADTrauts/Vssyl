/**
 * Notification settings adapter — routes KV writes through Settings Platform orchestration.
 * Closes PP2-F06 / PP2-F09 drift from direct Prisma in notificationController.
 */

import { prisma } from '../../lib/prisma';
import { updatePreference, SettingsServiceError } from './settingsService';
import { recordPreferenceChanged } from './settingsActivityService';

export type NotificationChannelPrefs = {
  inApp: boolean;
  email: boolean;
  push: boolean;
};

export type NotificationCategoryPrefs = Record<string, NotificationChannelPrefs>;

const NOTIFICATION_KEY_PREFIX = 'notification_';

function categoryKey(category: string, channel: 'inApp' | 'email' | 'push'): string {
  return `${NOTIFICATION_KEY_PREFIX}${category}_${channel}`;
}

function parseCategoryPrefs(rows: Array<{ key: string; value: string }>): NotificationCategoryPrefs {
  const prefs: NotificationCategoryPrefs = {};

  for (const pref of rows) {
    if (!pref.key.startsWith(NOTIFICATION_KEY_PREFIX)) continue;
    const keyParts = pref.key.split('_');
    if (keyParts.length < 3) continue;

    const channel = keyParts[keyParts.length - 1] as 'inApp' | 'email' | 'push';
    if (channel !== 'inApp' && channel !== 'email' && channel !== 'push') continue;

    const category = keyParts.slice(1, -1).join('_');
    if (!prefs[category]) {
      prefs[category] = { inApp: true, email: false, push: false };
    }
    prefs[category][channel] = pref.value === 'true';
  }

  return prefs;
}

export async function getNotificationCategoryPreferences(
  userId: string
): Promise<NotificationCategoryPrefs> {
  const preferences = await prisma.userPreference.findMany({
    where: {
      userId,
      key: { startsWith: NOTIFICATION_KEY_PREFIX },
    },
    select: { key: true, value: true },
  });

  return parseCategoryPrefs(preferences);
}

export async function saveNotificationCategoryPreferences(
  userId: string,
  preferences: NotificationCategoryPrefs
): Promise<void> {
  if (!preferences || typeof preferences !== 'object') {
    throw new SettingsServiceError('Invalid preferences data', 400);
  }

  const changedKeys: string[] = [];

  for (const [category, channels] of Object.entries(preferences)) {
    for (const [channel, enabled] of Object.entries(channels)) {
      if (channel !== 'inApp' && channel !== 'email' && channel !== 'push') continue;
      const key = categoryKey(category, channel);
      await updatePreference(userId, key, String(enabled));
      changedKeys.push(key);
    }
  }

  if (changedKeys.length > 0) {
    await recordPreferenceChanged(userId, changedKeys[0]);
  }
}

/** JSON notification keys routed through settings orchestration. */
export async function saveNotificationJsonPreference(
  userId: string,
  key: 'quiet_hours' | 'do_not_disturb',
  value: string
): Promise<void> {
  await updatePreference(userId, key, value);
}

export async function getNotificationJsonPreference(
  userId: string,
  key: 'quiet_hours' | 'do_not_disturb'
): Promise<string | null> {
  const row = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key } },
    select: { value: true },
  });
  return row?.value ?? null;
}
