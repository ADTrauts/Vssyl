import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    userPreference: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../settingsService', () => ({
  SettingsServiceError: class SettingsServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  updatePreference: vi.fn(),
}));

vi.mock('../settingsActivityService', () => ({
  recordPreferenceChanged: vi.fn(),
}));

import { prisma } from '../../../lib/prisma';
import { updatePreference } from '../settingsService';
import {
  getNotificationCategoryPreferences,
  saveNotificationCategoryPreferences,
} from '../notificationSettingsAdapter';

describe('notificationSettingsAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses notification category preferences from KV rows', async () => {
    vi.mocked(prisma.userPreference.findMany).mockResolvedValue([
      { key: 'notification_chat_inApp', value: 'true' },
      { key: 'notification_chat_email', value: 'false' },
      { key: 'notification_chat_push', value: 'true' },
    ] as never);

    const prefs = await getNotificationCategoryPreferences('user-1');
    expect(prefs.chat).toEqual({ inApp: true, email: false, push: true });
  });

  it('saves notification preferences via settingsService', async () => {
    vi.mocked(updatePreference).mockResolvedValue({ key: 'x', value: 'true' });

    await saveNotificationCategoryPreferences('user-1', {
      chat: { inApp: true, email: false, push: true },
    });

    expect(updatePreference).toHaveBeenCalledWith('user-1', 'notification_chat_inApp', 'true');
    expect(updatePreference).toHaveBeenCalledWith('user-1', 'notification_chat_email', 'false');
    expect(updatePreference).toHaveBeenCalledWith('user-1', 'notification_chat_push', 'true');
  });
});
