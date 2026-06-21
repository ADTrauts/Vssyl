/**
 * Authoritative preference registry (PP-2 Settings Platform).
 * Settings Platform owns the contract; domain owners own mutation logic for non-settings keys.
 */

export type PreferenceOwner =
  | 'settings'
  | 'identity'
  | 'notifications'
  | 'ai'
  | 'billing';

export type PreferenceScope = 'user' | 'business';

export type PreferenceType = 'string' | 'enum' | 'json' | 'boolean';

export type PreferenceStorage = 'user_preference' | 'privacy_settings' | 'external';

export interface PreferenceRegistryEntry {
  key: string;
  owner: PreferenceOwner;
  scope: PreferenceScope;
  type: PreferenceType;
  default: string;
  storage: PreferenceStorage;
  allowedValues?: readonly string[];
  writableViaSettingsApi: boolean;
  description: string;
  section: string;
}

export interface PreferencePrefixRule {
  prefix: string;
  owner: PreferenceOwner;
  scope: PreferenceScope;
  type: PreferenceType;
  storage: PreferenceStorage;
  writableViaSettingsApi: boolean;
  description: string;
  section: string;
}

/** Exact-key registry entries. */
export const PREFERENCE_REGISTRY: readonly PreferenceRegistryEntry[] = [
  {
    key: 'appearance.theme',
    owner: 'settings',
    scope: 'user',
    type: 'enum',
    default: 'system',
    storage: 'user_preference',
    allowedValues: ['light', 'dark', 'system'] as const,
    writableViaSettingsApi: true,
    description: 'UI color theme preference',
    section: 'appearance',
  },
  {
    key: 'privacy.profileVisibility',
    owner: 'identity',
    scope: 'user',
    type: 'enum',
    default: 'PUBLIC',
    storage: 'privacy_settings',
    allowedValues: ['PUBLIC', 'PRIVATE', 'CONNECTIONS'] as const,
    writableViaSettingsApi: false,
    description: 'Profile visibility (mutate via /api/privacy/settings)',
    section: 'privacy',
  },
  {
    key: 'privacy.activityVisibility',
    owner: 'identity',
    scope: 'user',
    type: 'enum',
    default: 'PUBLIC',
    storage: 'privacy_settings',
    allowedValues: ['PUBLIC', 'PRIVATE', 'CONNECTIONS'] as const,
    writableViaSettingsApi: false,
    description: 'Activity visibility (mutate via /api/privacy/settings)',
    section: 'privacy',
  },
  {
    key: 'notifications.email.enabled',
    owner: 'notifications',
    scope: 'user',
    type: 'boolean',
    default: 'true',
    storage: 'user_preference',
    writableViaSettingsApi: true,
    description: 'Master email notification toggle',
    section: 'notifications',
  },
  {
    key: 'quiet_hours',
    owner: 'notifications',
    scope: 'user',
    type: 'json',
    default: '{}',
    storage: 'user_preference',
    writableViaSettingsApi: true,
    description: 'Quiet hours schedule JSON',
    section: 'notifications',
  },
  {
    key: 'do_not_disturb',
    owner: 'notifications',
    scope: 'user',
    type: 'boolean',
    default: 'false',
    storage: 'user_preference',
    writableViaSettingsApi: true,
    description: 'Do not disturb enabled flag',
    section: 'notifications',
  },
] as const;

/** Prefix rules for dynamic keys. */
export const PREFERENCE_PREFIX_RULES: readonly PreferencePrefixRule[] = [
  {
    prefix: 'notification_',
    owner: 'notifications',
    scope: 'user',
    type: 'json',
    storage: 'user_preference',
    writableViaSettingsApi: true,
    description: 'In-app notification category preferences',
    section: 'notifications',
  },
  {
    prefix: 'email_',
    owner: 'notifications',
    scope: 'user',
    type: 'json',
    storage: 'user_preference',
    writableViaSettingsApi: true,
    description: 'Email notification category preferences',
    section: 'notifications',
  },
  {
    prefix: 'ai_preferred_',
    owner: 'ai',
    scope: 'user',
    type: 'string',
    storage: 'user_preference',
    writableViaSettingsApi: false,
    description: 'AI provider preferences (mutate via AI Platform APIs)',
    section: 'ai',
  },
] as const;

const registryByKey = new Map(PREFERENCE_REGISTRY.map((e) => [e.key, e]));

export function getRegistryEntry(key: string): PreferenceRegistryEntry | undefined {
  return registryByKey.get(key);
}

export function resolvePrefixRule(key: string): PreferencePrefixRule | undefined {
  return PREFERENCE_PREFIX_RULES.find((rule) => key.startsWith(rule.prefix));
}

export function resolveRegistryMetadata(key: string): {
  entry?: PreferenceRegistryEntry;
  prefixRule?: PreferencePrefixRule;
  known: boolean;
} {
  const entry = getRegistryEntry(key);
  if (entry) return { entry, known: true };
  const prefixRule = resolvePrefixRule(key);
  if (prefixRule) return { prefixRule, known: true };
  return { known: false };
}

export function isWritableViaSettingsApi(key: string): boolean {
  const { entry, prefixRule } = resolveRegistryMetadata(key);
  if (entry) return entry.writableViaSettingsApi;
  if (prefixRule) return prefixRule.writableViaSettingsApi;
  return false;
}

export function getDefaultForKey(key: string): string | null {
  const { entry } = resolveRegistryMetadata(key);
  return entry?.default ?? null;
}

export function validateRegistryValue(key: string, value: string): void {
  const { entry } = resolveRegistryMetadata(key);
  if (!entry) return;
  if (entry.type === 'enum' && entry.allowedValues && !entry.allowedValues.includes(value)) {
    throw new SettingsRegistryError(
      `Invalid value for ${key}. Allowed: ${entry.allowedValues.join(', ')}`,
      400
    );
  }
  if (entry.type === 'boolean' && value !== 'true' && value !== 'false') {
    throw new SettingsRegistryError(`Invalid boolean value for ${key}`, 400);
  }
}

export class SettingsRegistryError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'SettingsRegistryError';
  }
}

export function listRegistryKeysForScope(scope: PreferenceScope): string[] {
  return PREFERENCE_REGISTRY.filter((e) => e.scope === scope && e.storage === 'user_preference').map(
    (e) => e.key
  );
}
