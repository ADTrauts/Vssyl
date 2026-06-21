import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { assertIdentitySelfPolicy } from '../../auth/identityPolicyDual';
import {
  getUserPreference,
  setUserPreference,
  deleteUserPreference,
  UserPreferenceServiceError,
} from '../userPreferenceService';
import { getOrCreatePrivacySettings } from './privacyService';
import {
  PREFERENCE_REGISTRY,
  PREFERENCE_PREFIX_RULES,
  resolveRegistryMetadata,
  isWritableViaSettingsApi,
  validateRegistryValue,
  getDefaultForKey,
  SettingsRegistryError,
  listRegistryKeysForScope,
} from './preferenceRegistry';
import {
  SETTINGS_NAVIGATION_CONTRACT,
  SETTINGS_CANONICAL_SECTIONS,
  type SettingsNavigationEntry,
} from './settingsNavigationContract';
import {
  SETTINGS_HUB_INVENTORY,
  getHubInventorySummary,
  type SettingsHubEntry,
} from './settingsHubInventory';
import {
  recordSettingsUpdated,
  recordThemeChanged,
  recordPreferenceChanged,
} from './settingsActivityService';

export class SettingsServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'SettingsServiceError';
  }
}

export interface SettingsSection {
  id: string;
  label: string;
  owner: string;
  keys: string[];
  readOnly: boolean;
}

export interface ResolvedSettings {
  settings: Record<string, string>;
  registry: Array<{
    key: string;
    owner: string;
    scope: string;
    type: string;
    default: string;
    writableViaSettingsApi: boolean;
    section: string;
  }>;
}

async function assertSettingsRead(userId: string): Promise<void> {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.SETTINGS_READ,
  });
}

async function assertSettingsUpdate(userId: string): Promise<void> {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.SETTINGS_UPDATE,
  });
}

async function readPrivacyProjection(userId: string, key: string): Promise<string | null> {
  const privacy = await getOrCreatePrivacySettings(userId);
  if (key === 'privacy.profileVisibility') {
    return privacy.profileVisibility;
  }
  if (key === 'privacy.activityVisibility') {
    return privacy.activityVisibility;
  }
  return null;
}

async function readPreferenceValue(userId: string, key: string): Promise<string> {
  const meta = resolveRegistryMetadata(key);
  if (meta.entry?.storage === 'privacy_settings') {
    const projected = await readPrivacyProjection(userId, key);
    return projected ?? meta.entry.default;
  }
  const stored = await getUserPreference(userId, key);
  if (stored !== null) return stored;
  return getDefaultForKey(key) ?? '';
}

export async function resolvePreference(userId: string, key: string): Promise<{ key: string; value: string }> {
  await assertSettingsRead(userId);
  const meta = resolveRegistryMetadata(key);
  if (!meta.known) {
    throw new SettingsServiceError(`Unknown preference key: ${key}`, 400);
  }
  const value = await readPreferenceValue(userId, key);
  return { key, value };
}

export async function resolveSettings(userId: string): Promise<ResolvedSettings> {
  await assertSettingsRead(userId);

  const settings: Record<string, string> = {};

  for (const entry of PREFERENCE_REGISTRY) {
    if (entry.scope !== 'user') continue;
    settings[entry.key] = await readPreferenceValue(userId, entry.key);
  }

  const storedPrefs = await prisma.userPreference.findMany({
    where: { userId },
    select: { key: true, value: true },
  });

  for (const pref of storedPrefs) {
    const meta = resolveRegistryMetadata(pref.key);
    if (!meta.known) continue;
    if (settings[pref.key] !== undefined && meta.entry?.storage === 'privacy_settings') continue;
    settings[pref.key] = pref.value;
  }

  const registry = PREFERENCE_REGISTRY.map((entry) => ({
    key: entry.key,
    owner: entry.owner,
    scope: entry.scope,
    type: entry.type,
    default: entry.default,
    writableViaSettingsApi: entry.writableViaSettingsApi,
    section: entry.section,
  }));

  return { settings, registry };
}

export async function updatePreference(
  userId: string,
  key: string,
  value: string
): Promise<{ key: string; value: string }> {
  await assertSettingsUpdate(userId);

  const meta = resolveRegistryMetadata(key);
  if (!meta.known) {
    throw new SettingsServiceError(`Unknown preference key: ${key}`, 400);
  }
  if (!isWritableViaSettingsApi(key)) {
    throw new SettingsServiceError(
      `Preference ${key} is not writable via Settings API — use the owning domain API`,
      403
    );
  }

  try {
    validateRegistryValue(key, value);
  } catch (error: unknown) {
    if (error instanceof SettingsRegistryError) {
      throw new SettingsServiceError(error.message, error.statusCode);
    }
    throw error;
  }

  try {
    await setUserPreference(userId, key, value);
  } catch (error: unknown) {
    if (error instanceof UserPreferenceServiceError) {
      throw new SettingsServiceError(error.message, error.statusCode);
    }
    throw error;
  }

  if (key === 'appearance.theme') {
    await recordThemeChanged(userId, value);
  } else {
    await recordPreferenceChanged(userId, key);
  }

  return { key, value };
}

export async function updateSettings(
  userId: string,
  input: { key?: string; value?: string; settings?: Record<string, string> }
): Promise<ResolvedSettings> {
  const updates: Record<string, string> = {};

  if (typeof input.key === 'string' && typeof input.value === 'string') {
    updates[input.key] = input.value;
  } else if (input.settings && typeof input.settings === 'object') {
    Object.assign(updates, input.settings);
  } else {
    throw new SettingsServiceError('Provide { key, value } or { settings: Record<string, string> }', 400);
  }

  const changedKeys: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    await updatePreference(userId, key, value);
    changedKeys.push(key);
  }

  if (changedKeys.length > 1) {
    await recordSettingsUpdated(userId, changedKeys);
  }

  return resolveSettings(userId);
}

export async function deletePreference(userId: string, key: string): Promise<void> {
  await assertSettingsUpdate(userId);
  if (!isWritableViaSettingsApi(key)) {
    throw new SettingsServiceError(`Preference ${key} cannot be deleted via Settings API`, 403);
  }
  await deleteUserPreference(userId, key);
  await recordPreferenceChanged(userId, key);
}

export async function resolveSettingsSections(userId: string): Promise<{
  sections: SettingsSection[];
  navigation: SettingsNavigationEntry[];
  canonicalSections: typeof SETTINGS_CANONICAL_SECTIONS;
  hubInventory: SettingsHubEntry[];
  hubSummary: ReturnType<typeof getHubInventorySummary>;
}> {
  await assertSettingsRead(userId);

  const sectionMap = new Map<string, SettingsSection>();

  for (const entry of PREFERENCE_REGISTRY) {
    if (entry.scope !== 'user') continue;
    const existing = sectionMap.get(entry.section) ?? {
      id: entry.section,
      label: entry.section.charAt(0).toUpperCase() + entry.section.slice(1),
      owner: entry.owner,
      keys: [],
      readOnly: !entry.writableViaSettingsApi,
    };
    existing.keys.push(entry.key);
    sectionMap.set(entry.section, existing);
  }

  for (const rule of PREFERENCE_PREFIX_RULES) {
    const existing = sectionMap.get(rule.section) ?? {
      id: rule.section,
      label: rule.section.charAt(0).toUpperCase() + rule.section.slice(1),
      owner: rule.owner,
      keys: [`${rule.prefix}*`],
      readOnly: !rule.writableViaSettingsApi,
    };
    if (!existing.keys.includes(`${rule.prefix}*`)) {
      existing.keys.push(`${rule.prefix}*`);
    }
    sectionMap.set(rule.section, existing);
  }

  return {
    sections: Array.from(sectionMap.values()),
    navigation: [...SETTINGS_NAVIGATION_CONTRACT],
    canonicalSections: [...SETTINGS_CANONICAL_SECTIONS],
    hubInventory: [...SETTINGS_HUB_INVENTORY],
    hubSummary: getHubInventorySummary(),
  };
}

/** Keys persisted in UserPreference that settings platform orchestrates. */
export function listSettingsManagedKeys(): string[] {
  return listRegistryKeysForScope('user');
}
