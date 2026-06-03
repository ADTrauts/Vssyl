import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import { PlaceServiceError } from './placeErrors';
import { assertCanReadListingAdmin } from './placePermissionService';
import { assertPlacePolicyAllowed } from './placePolicyDual';

const VSSYL_FEE_RATE = 0.029;

export async function createTransaction(params: {
  userId: string;
  businessId: string;
  type: string;
  amount?: number | null;
  currency?: string | null;
  description?: string | null;
  externalService?: string | null;
  externalUrl?: string | null;
  interactionLinkId?: string | null;
}) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  if (!params.businessId || !params.type) {
    throw new PlaceServiceError('businessId and type are required', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_TRANSACTION_CREATE,
    resourceType: 'place_transaction',
    resourceId: params.userId,
  });

  const vssylFee =
    params.type === 'PURCHASE' && params.amount
      ? Math.round(params.amount * VSSYL_FEE_RATE * 100) / 100
      : null;

  return prisma.placeTransaction.create({
    data: {
      userId: params.userId,
      businessId: params.businessId,
      type: params.type as 'PURCHASE' | 'EXTERNAL_CLICK' | 'RESERVATION',
      amount: params.amount ?? null,
      currency: params.currency || 'USD',
      vssylFee,
      description: params.description ?? null,
      externalService: params.externalService ?? null,
      externalUrl: params.externalUrl ?? null,
      interactionLinkId: params.interactionLinkId ?? null,
      status: params.type === 'EXTERNAL_CLICK' ? 'COMPLETED' : 'PENDING',
      completedAt: params.type === 'EXTERNAL_CLICK' ? new Date() : null,
    },
  });
}

export async function listTransactions(params: {
  userId: string;
  limit?: number;
  offset?: number;
  type?: string;
  businessId?: string;
}) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_TRANSACTION_READ,
    resourceType: 'place_transaction',
    resourceId: params.userId,
  });

  const take = Math.min(params.limit ?? 30, 100);
  const skip = params.offset ?? 0;

  const where: Prisma.PlaceTransactionWhereInput = { userId: params.userId };
  if (params.type) {
    where.type = params.type as Prisma.EnumPlaceTransactionTypeFilter['equals'];
  }
  if (params.businessId) where.businessId = params.businessId;

  const [transactions, total] = await Promise.all([
    prisma.placeTransaction.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, logo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.placeTransaction.count({ where }),
  ]);

  return { transactions, pagination: { total, limit: take, offset: skip } };
}

export async function getTransaction(params: { userId: string; transactionId: string }) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }

  const transaction = await prisma.placeTransaction.findUnique({
    where: { id: params.transactionId },
    include: {
      business: { select: { id: true, name: true, logo: true, email: true } },
    },
  });

  if (!transaction || transaction.userId !== params.userId) {
    throw new PlaceServiceError('Transaction not found', 'not_found', 404);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_TRANSACTION_READ,
    resourceType: 'place_transaction',
    resourceId: params.transactionId,
  });

  return transaction;
}

export async function updateTransactionPrivacy(params: {
  userId: string;
  transactionId: string;
  isPrivate: boolean;
}) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  if (typeof params.isPrivate !== 'boolean') {
    throw new PlaceServiceError('isPrivate must be a boolean', 'invalid', 400);
  }

  const transaction = await prisma.placeTransaction.findUnique({
    where: { id: params.transactionId },
    select: { userId: true },
  });
  if (!transaction || transaction.userId !== params.userId) {
    throw new PlaceServiceError('Transaction not found', 'not_found', 404);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_TRANSACTION_PRIVACY_UPDATE,
    resourceType: 'place_transaction',
    resourceId: params.transactionId,
  });

  return prisma.placeTransaction.update({
    where: { id: params.transactionId },
    data: { isPrivate: params.isPrivate },
  });
}

export async function getTransactionSummary(userId: string) {
  if (!userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }

  await assertPlacePolicyAllowed({
    userId,
    action: POLICY_ACTIONS.PLACE_TRANSACTION_READ,
    resourceType: 'place_transaction',
    resourceId: userId,
  });

  const [totalCount, purchases, clicks] = await Promise.all([
    prisma.placeTransaction.count({ where: { userId } }),
    prisma.placeTransaction.aggregate({
      where: { userId, type: 'PURCHASE', status: 'COMPLETED' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.placeTransaction.count({ where: { userId, type: 'EXTERNAL_CLICK' } }),
  ]);

  const topBusinesses = await prisma.placeTransaction.groupBy({
    by: ['businessId'],
    where: { userId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const topIds = topBusinesses.map((t) => t.businessId);
  const businesses =
    topIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: topIds } },
          select: { id: true, name: true, logo: true },
        })
      : [];

  const businessMap = Object.fromEntries(businesses.map((b) => [b.id, b]));

  return {
    totalTransactions: totalCount,
    totalSpent: purchases._sum.amount || 0,
    purchaseCount: purchases._count.id,
    externalClickCount: clicks,
    topBusinesses: topBusinesses.map((t) => ({
      business: businessMap[t.businessId] || { id: t.businessId, name: 'Unknown' },
      interactionCount: t._count.id,
    })),
  };
}

export async function trackInteractionClick(params: {
  userId: string;
  businessId: string;
  interactionLinkId?: string | null;
  externalService?: string | null;
  url: string;
}) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }
  if (!params.businessId || !params.url) {
    throw new PlaceServiceError('businessId and url are required', 'invalid', 400);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_INTERACTION_CLICK,
    resourceType: 'place_transaction',
    resourceId: params.userId,
  });

  await prisma.placeInteractionClick.create({
    data: {
      userId: params.userId,
      businessId: params.businessId,
      interactionLinkId: params.interactionLinkId || '',
      externalService: params.externalService || 'CUSTOM',
      url: params.url,
    },
  });

  await prisma.placeTransaction.create({
    data: {
      userId: params.userId,
      businessId: params.businessId,
      type: 'EXTERNAL_CLICK',
      status: 'COMPLETED',
      description: `Visited ${params.externalService || 'external link'}`,
      externalService: params.externalService ?? null,
      externalUrl: params.url,
      interactionLinkId: params.interactionLinkId ?? null,
      completedAt: new Date(),
    },
  });

  return { success: true as const };
}

export async function getInteractionStats(params: { userId: string; businessId: string }) {
  if (!params.userId) {
    throw new PlaceServiceError('Authentication required', 'unauthorized', 401);
  }

  try {
    await assertCanReadListingAdmin(params.userId, params.businessId);
  } catch {
    throw new PlaceServiceError('Admin access required', 'forbidden', 403);
  }

  await assertPlacePolicyAllowed({
    userId: params.userId,
    action: POLICY_ACTIONS.PLACE_INTERACTION_STATS_READ,
    resourceType: 'place_listing',
    resourceId: params.businessId,
  });

  const [totalClicks, clicksByService, recentClicks, followerCount] = await Promise.all([
    prisma.placeInteractionClick.count({ where: { businessId: params.businessId } }),
    prisma.placeInteractionClick.groupBy({
      by: ['externalService'],
      where: { businessId: params.businessId },
      _count: { id: true },
    }),
    prisma.placeInteractionClick.count({
      where: {
        businessId: params.businessId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.placeNode.count({
      where: { nodeType: 'BUSINESS', entityId: params.businessId },
    }),
  ]);

  return {
    totalClicks,
    clicksLast7Days: recentClicks,
    followerCount,
    byService: clicksByService.map((c) => ({
      service: c.externalService,
      count: c._count.id,
    })),
  };
}
