/**
 * Hard gates before outbound external READ calls.
 */

import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface ExternalReadGateResult {
  allowed: boolean;
  reason?: 'business_external_api_denied' | 'missing_user';
}

function readExternalApiAccessFalse(restrictions: unknown): boolean {
  if (!restrictions || typeof restrictions !== 'object') return false;
  const r = restrictions as Record<string, unknown>;
  return r.externalAPIAccess === false;
}

/**
 * Returns false when business workspace policy explicitly denies external API access.
 */
export async function assertBusinessExternalReadAllowed(
  input: { userId?: string; businessId?: string | null },
  db: PrismaClient = prisma
): Promise<ExternalReadGateResult> {
  if (!input.userId?.trim()) {
    return { allowed: false, reason: 'missing_user' };
  }

  const businessId = input.businessId?.trim();
  if (!businessId) {
    return { allowed: true };
  }

  const twin = await db.businessAIDigitalTwin.findUnique({
    where: { businessId },
    select: { restrictions: true, status: true, allowEmployeeInteraction: true },
  });

  if (!twin || twin.status !== 'active' || !twin.allowEmployeeInteraction) {
    return { allowed: true };
  }

  if (readExternalApiAccessFalse(twin.restrictions)) {
    return { allowed: false, reason: 'business_external_api_denied' };
  }

  return { allowed: true };
}
