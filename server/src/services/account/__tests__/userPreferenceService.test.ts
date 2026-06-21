import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../auth/identityPolicyDual', () => ({
  assertIdentitySelfPolicy: vi.fn(),
}));

vi.mock('../../../events/domainEventEmitters', () => ({
  emitUserPreferenceUpdatedEvent: vi.fn(),
}));

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    userPreference: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../../lib/prisma';
import { assertIdentitySelfPolicy } from '../../../auth/identityPolicyDual';
import { emitUserPreferenceUpdatedEvent } from '../../../events/domainEventEmitters';
import {
  validatePreferenceKey,
  setUserPreferenceWithPolicy,
  UserPreferenceServiceError,
} from '../../userPreferenceService';

describe('userPreferenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validatePreferenceKey rejects invalid characters', () => {
    expect(() => validatePreferenceKey('bad key!')).toThrow(UserPreferenceServiceError);
  });

  it('setUserPreferenceWithPolicy writes and emits domain event', async () => {
    vi.mocked(prisma.userPreference.upsert).mockResolvedValue({
      id: 'pref-1',
      userId: 'user-1',
      key: 'appearance.theme',
      value: 'dark',
      updatedAt: new Date(),
    } as Awaited<ReturnType<typeof prisma.userPreference.upsert>>);

    await setUserPreferenceWithPolicy('user-1', 'appearance.theme', 'dark');

    expect(assertIdentitySelfPolicy).toHaveBeenCalled();
    expect(prisma.userPreference.upsert).toHaveBeenCalled();
    expect(emitUserPreferenceUpdatedEvent).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      preferenceKey: 'appearance.theme',
    });
  });
});
