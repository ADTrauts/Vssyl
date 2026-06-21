import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POLICY_ACTIONS } from '../../../auth/policyActions';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../auth/identityPolicyDual', () => ({
  assertIdentitySelfPolicy: vi.fn(),
}));

vi.mock('../identityActivityService', () => ({
  recordProfileUpdated: vi.fn(),
}));

import { prisma } from '../../../lib/prisma';
import { assertIdentitySelfPolicy } from '../../../auth/identityPolicyDual';
import { recordProfileUpdated } from '../identityActivityService';
import { updateProfileName, ProfileServiceError } from '../profileService';

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updateProfileName rejects empty name', async () => {
    await expect(updateProfileName('user-1', '   ')).rejects.toThrow(ProfileServiceError);
    expect(assertIdentitySelfPolicy).not.toHaveBeenCalled();
  });

  it('updateProfileName authorizes, updates, and records activity', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'a@test.com',
      role: 'USER',
      emailVerified: null,
      image: null,
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      userNumber: null,
      countryId: null,
      regionId: null,
      townId: null,
      locationDetectedAt: null,
      locationUpdatedAt: null,
      lastActiveAt: null,
    } as Awaited<ReturnType<typeof prisma.user.update>>);

    const result = await updateProfileName('user-1', 'Alice');

    expect(assertIdentitySelfPolicy).toHaveBeenCalledWith({
      userId: 'user-1',
      action: POLICY_ACTIONS.USER_PROFILE_UPDATE,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Alice' },
      select: expect.any(Object),
    });
    expect(recordProfileUpdated).toHaveBeenCalledWith('user-1');
    expect(result.name).toBe('Alice');
  });
});
