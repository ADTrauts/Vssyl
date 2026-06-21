import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { assertIdentitySelfPolicy } from '../auth/identityPolicyDual';
import { emitUserPreferenceUpdatedEvent } from '../events/domainEventEmitters';

/** Registry prefixes for PP-1 preference keys (expanded in PP-2). */
export const PREFERENCE_KEY_PREFIXES = ['notification_', 'email_', 'appearance.', 'ai_preferred_'] as const;

const MAX_KEY_LENGTH = 128;
const MAX_VALUE_LENGTH = 8192;

export class UserPreferenceServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'UserPreferenceServiceError';
  }
}

export function validatePreferenceKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new UserPreferenceServiceError('Preference key is required', 400);
  }
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_KEY_LENGTH) {
    throw new UserPreferenceServiceError('Invalid preference key length', 400);
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    throw new UserPreferenceServiceError('Preference key contains invalid characters', 400);
  }
}

export function validatePreferenceValue(value: string): void {
  if (typeof value !== 'string') {
    throw new UserPreferenceServiceError('Value must be a string', 400);
  }
  if (value.length > MAX_VALUE_LENGTH) {
    throw new UserPreferenceServiceError('Preference value too large', 400);
  }
}

export async function getUserPreference(userId: string, key: string): Promise<string | null> {
  validatePreferenceKey(key);
  const pref = await prisma.userPreference.findUnique({
    where: { userId_key: { userId, key } },
  });
  return pref ? pref.value : null;
}

export async function setUserPreference(userId: string, key: string, value: string): Promise<void> {
  validatePreferenceKey(key);
  validatePreferenceValue(value);
  await prisma.userPreference.upsert({
    where: { userId_key: { userId, key } },
    update: { value },
    create: { userId, key, value },
  });
}

export async function deleteUserPreference(userId: string, key: string): Promise<void> {
  validatePreferenceKey(key);
  await prisma.userPreference.deleteMany({
    where: { userId, key },
  });
}

export async function setUserPreferenceWithPolicy(
  userId: string,
  key: string,
  value: string,
  options?: { emitDomainEvent?: boolean }
): Promise<void> {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PREFERENCE_WRITE,
  });
  await setUserPreference(userId, key, value);
  if (options?.emitDomainEvent !== false) {
    emitUserPreferenceUpdatedEvent({
      actorUserId: userId,
      preferenceKey: key,
    });
  }
}

export async function getUserPreferencesByPrefix(userId: string, prefix: string) {
  validatePreferenceKey(prefix);
  const prefs = await prisma.userPreference.findMany({
    where: {
      userId,
      key: { startsWith: prefix },
    },
  });
  return prefs.map((p: { key: string; value: string }) => ({ key: p.key, value: p.value }));
}

export function isKnownPreferencePrefix(key: string): boolean {
  return PREFERENCE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}
