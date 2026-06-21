import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../auth/identityPolicyDual', () => ({
  assertIdentitySelfPolicy: vi.fn(),
}));

vi.mock('../../userPreferenceService', () => ({
  getUserPreference: vi.fn(),
  setUserPreference: vi.fn(),
  deleteUserPreference: vi.fn(),
  UserPreferenceServiceError: class UserPreferenceServiceError extends Error {
    statusCode = 400;
  },
}));

vi.mock('../privacyService', () => ({
  getOrCreatePrivacySettings: vi.fn(),
}));

vi.mock('../settingsActivityService', () => ({
  recordSettingsUpdated: vi.fn(),
  recordThemeChanged: vi.fn(),
  recordPreferenceChanged: vi.fn(),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    userPreference: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { assertIdentitySelfPolicy } from '../../../auth/identityPolicyDual';
import { getUserPreference, setUserPreference } from '../../userPreferenceService';
import { getOrCreatePrivacySettings } from '../privacyService';
import { recordThemeChanged } from '../settingsActivityService';
import {
  updatePreference,
  resolvePreference,
  SettingsServiceError,
} from '../settingsService';

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updatePreference writes appearance.theme and records theme activity', async () => {
    vi.mocked(setUserPreference).mockResolvedValue(undefined);

    const result = await updatePreference('user-1', 'appearance.theme', 'dark');

    expect(assertIdentitySelfPolicy).toHaveBeenCalled();
    expect(setUserPreference).toHaveBeenCalledWith('user-1', 'appearance.theme', 'dark');
    expect(recordThemeChanged).toHaveBeenCalledWith('user-1', 'dark');
    expect(result).toEqual({ key: 'appearance.theme', value: 'dark' });
  });

  it('rejects writes to identity-owned privacy keys', async () => {
    await expect(
      updatePreference('user-1', 'privacy.profileVisibility', 'PRIVATE')
    ).rejects.toThrow(SettingsServiceError);
    expect(setUserPreference).not.toHaveBeenCalled();
  });

  it('resolvePreference projects privacy settings', async () => {
    vi.mocked(getOrCreatePrivacySettings).mockResolvedValue({
      profileVisibility: 'PRIVATE',
      activityVisibility: 'PUBLIC',
    } as Awaited<ReturnType<typeof getOrCreatePrivacySettings>>);

    const result = await resolvePreference('user-1', 'privacy.profileVisibility');
    expect(result.value).toBe('PRIVATE');
  });

  it('resolvePreference returns stored user preference with default fallback', async () => {
    vi.mocked(getUserPreference).mockResolvedValue(null);

    const result = await resolvePreference('user-1', 'appearance.theme');
    expect(result.value).toBe('system');
  });
});
