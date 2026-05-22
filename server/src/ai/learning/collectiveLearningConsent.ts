import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/**
 * User must explicitly opt in before collective/global patterns affect their twin.
 * Default: false (never silent injection).
 */
export async function userAllowsCollectiveLearning(
  userId: string,
  db: PrismaClient = prisma
): Promise<boolean> {
  try {
    const userPrivacy = await db.userPrivacySettings.findUnique({
      where: { userId },
      select: { allowCollectiveLearning: true },
    });

    if (userPrivacy?.allowCollectiveLearning === true) {
      return true;
    }

    const consent = await db.userConsent.findFirst({
      where: {
        userId,
        consentType: 'COLLECTIVE_AI_LEARNING',
        granted: true,
        revokedAt: null,
      },
      orderBy: { grantedAt: 'desc' },
      select: { id: true },
    });

    return Boolean(consent);
  } catch {
    return false;
  }
}
