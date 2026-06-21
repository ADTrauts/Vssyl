import { prisma } from '../../lib/prisma';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { assertIdentitySelfPolicy } from '../../auth/identityPolicyDual';
import { recordProfileUpdated } from './identityActivityService';

const PROFILE_SELECT = {
  id: true,
  email: true,
  role: true,
  name: true,
  emailVerified: true,
  image: true,
  stripeCustomerId: true,
  createdAt: true,
  updatedAt: true,
  userNumber: true,
  countryId: true,
  regionId: true,
  townId: true,
  locationDetectedAt: true,
  locationUpdatedAt: true,
  lastActiveAt: true,
} as const;

export class ProfileServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ProfileServiceError';
  }
}

export async function getProfileForUser(userId: string) {
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PROFILE_READ,
  });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });
  if (!user) {
    throw new ProfileServiceError('User not found', 404);
  }
  return user;
}

export async function updateProfileName(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new ProfileServiceError('Name is required', 400);
  }
  await assertIdentitySelfPolicy({
    userId,
    action: POLICY_ACTIONS.USER_PROFILE_UPDATE,
  });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name: trimmed },
    select: PROFILE_SELECT,
  });
  await recordProfileUpdated(userId);
  return updated;
}
