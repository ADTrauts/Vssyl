import type { Subscription } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { SubscriptionService } from '../subscriptionService';
import { StripeSyncService } from '../stripeSyncService';
import { assertBillingReadPolicy, assertBillingWritePolicy } from '../../auth/billingPolicyDual';
import { syncBusinessTierCache } from './entitlementService';
import { isPlatformTier, normalizeTier, type PlatformTier } from './entitlementTypes';
import {
  recordBillingSyncCompleted,
  recordSubscriptionCancelled,
  recordSubscriptionCreated,
  recordSubscriptionResumed,
  recordSubscriptionUpdated,
} from './billingActivityService';
import {
  emitBillingSyncCompletedEvent,
  emitSubscriptionCancelledEvent,
  emitSubscriptionCreatedEvent,
  emitSubscriptionResumedEvent,
  emitSubscriptionUpdatedEvent,
} from './billingDomainEventService';

const subscriptionService = new SubscriptionService();

export class BillingServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'BillingServiceError';
  }
}

export interface ResolveSubscriptionParams {
  userId: string;
  businessId?: string | null;
  subscriptionId?: string;
}

export interface CreateSubscriptionParams {
  actorUserId: string;
  userId: string;
  businessId?: string;
  tier: string;
  stripeCustomerId?: string;
  employeeCount?: number;
  billingCycle?: 'monthly' | 'yearly';
}

export interface UpdateSubscriptionParams {
  actorUserId: string;
  userId: string;
  subscriptionId: string;
  tier?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface SubscriptionMutationParams {
  actorUserId: string;
  userId: string;
  subscriptionId: string;
}

export interface SyncSubscriptionParams {
  actorUserId: string;
  subscriptionId: string;
  source?: 'stripe_sync' | 'checkout';
}

export interface CheckoutSubscriptionData {
  userId: string;
  businessId?: string | null;
  tier: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  cancelAtPeriodEnd: boolean;
}

function normalizeSubscriptionTier(tier: string, businessId?: string | null): string {
  return normalizeTier(tier, Boolean(businessId));
}

async function syncEntitlementCacheFromSubscription(
  subscription: Pick<Subscription, 'businessId' | 'tier' | 'id'>
): Promise<void> {
  if (!subscription.businessId) return;
  const tier = normalizeSubscriptionTier(subscription.tier, subscription.businessId);
  if (isPlatformTier(tier)) {
    await syncBusinessTierCache(subscription.businessId, tier);
  }
}

/**
 * Resolve active or specific platform subscription for a user/business context.
 */
export async function resolveSubscription(
  params: ResolveSubscriptionParams
): Promise<Subscription | null> {
  if (params.subscriptionId) {
    return prisma.subscription.findUnique({ where: { id: params.subscriptionId } });
  }
  if (params.businessId) {
    return prisma.subscription.findFirst({
      where: { businessId: params.businessId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }
  return prisma.subscription.findFirst({
    where: { userId: params.userId, businessId: null, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSubscriptionForUser(
  userId: string,
  subscriptionId: string
): Promise<Subscription> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    throw new BillingServiceError('Subscription not found', 404);
  }
  await assertBillingReadPolicy({
    userId,
    subscriptionUserId: subscription.userId,
    businessId: subscription.businessId,
  });
  if (subscription.userId !== userId) {
    throw new BillingServiceError('Access denied', 403);
  }
  return subscription;
}

export async function getUserActiveSubscription(userId: string): Promise<Subscription | null> {
  return resolveSubscription({ userId });
}

export async function createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
  const tier = normalizeSubscriptionTier(params.tier, params.businessId);
  const subscription = await subscriptionService.createSubscription({
    userId: params.userId,
    businessId: params.businessId,
    tier: tier as 'free' | 'standard' | 'enterprise',
    stripeCustomerId: params.stripeCustomerId,
    employeeCount: params.employeeCount,
    billingCycle: params.billingCycle,
  });

  await syncEntitlementCacheFromSubscription(subscription);
  await recordSubscriptionCreated(params.actorUserId, subscription.id, {
    tier: subscription.tier,
    businessId: subscription.businessId,
  });
  emitSubscriptionCreatedEvent({
    actorUserId: params.actorUserId,
    subscriptionId: subscription.id,
    businessId: subscription.businessId,
    tier: subscription.tier,
  });

  void logger.info('Subscription created via billingService', {
    operation: 'billing_create_subscription',
    subscriptionId: subscription.id,
    userId: params.userId,
    businessId: params.businessId,
    tier: subscription.tier,
  });

  return subscription;
}

export async function updateSubscription(params: UpdateSubscriptionParams): Promise<Subscription> {
  const existing = await getSubscriptionForUser(params.userId, params.subscriptionId);
  await assertBillingWritePolicy({
    userId: params.actorUserId,
    subscriptionUserId: existing.userId,
    businessId: existing.businessId,
  });

  const previousTier = existing.tier;
  const normalizedTier = params.tier
    ? normalizeSubscriptionTier(params.tier, existing.businessId)
    : undefined;

  const updated = await subscriptionService.updateSubscription({
    subscriptionId: params.subscriptionId,
    tier: normalizedTier as 'free' | 'standard' | 'enterprise' | undefined,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
  });

  await syncEntitlementCacheFromSubscription(updated);

  const changedFields: string[] = [];
  if (normalizedTier && normalizedTier !== previousTier) changedFields.push('tier');
  if (params.cancelAtPeriodEnd !== undefined) changedFields.push('cancelAtPeriodEnd');

  await recordSubscriptionUpdated(params.actorUserId, updated.id, {
    previousTier,
    newTier: normalizedTier ?? updated.tier,
    businessId: updated.businessId,
    fields: changedFields,
  });
  emitSubscriptionUpdatedEvent({
    actorUserId: params.actorUserId,
    subscriptionId: updated.id,
    businessId: updated.businessId,
    previousTier,
    newTier: updated.tier,
    changedFields,
  });

  return updated;
}

export async function cancelSubscription(params: SubscriptionMutationParams): Promise<Subscription> {
  const existing = await getSubscriptionForUser(params.userId, params.subscriptionId);
  await assertBillingWritePolicy({
    userId: params.actorUserId,
    subscriptionUserId: existing.userId,
    businessId: existing.businessId,
  });

  const updated = await subscriptionService.cancelSubscription(params.subscriptionId);

  await recordSubscriptionCancelled(params.actorUserId, updated.id, {
    businessId: updated.businessId,
  });
  emitSubscriptionCancelledEvent({
    actorUserId: params.actorUserId,
    subscriptionId: updated.id,
    businessId: updated.businessId,
  });

  return updated;
}

export async function resumeSubscription(params: SubscriptionMutationParams): Promise<Subscription> {
  const existing = await getSubscriptionForUser(params.userId, params.subscriptionId);
  await assertBillingWritePolicy({
    userId: params.actorUserId,
    subscriptionUserId: existing.userId,
    businessId: existing.businessId,
  });

  const updated = await subscriptionService.reactivateSubscription(params.subscriptionId);

  await syncEntitlementCacheFromSubscription(updated);

  await recordSubscriptionResumed(params.actorUserId, updated.id, {
    businessId: updated.businessId,
  });
  emitSubscriptionResumedEvent({
    actorUserId: params.actorUserId,
    subscriptionId: updated.id,
    businessId: updated.businessId,
  });

  return updated;
}

/**
 * Sync subscription state from Stripe and align entitlement cache.
 */
export async function syncSubscription(params: SyncSubscriptionParams): Promise<Subscription> {
  const existing = await prisma.subscription.findFirst({
    where: {
      OR: [{ id: params.subscriptionId }, { stripeSubscriptionId: params.subscriptionId }],
    },
  });
  if (!existing) {
    throw new BillingServiceError('Subscription not found', 404);
  }

  await StripeSyncService.syncSubscriptionFromStripe(existing.id);

  const refreshed = await prisma.subscription.findUnique({ where: { id: existing.id } });
  if (!refreshed) {
    throw new BillingServiceError('Subscription not found after sync', 404);
  }

  await syncEntitlementCacheFromSubscription(refreshed);

  const source = params.source ?? 'stripe_sync';
  await recordBillingSyncCompleted(params.actorUserId, refreshed.id, {
    source,
    businessId: refreshed.businessId,
  });
  emitBillingSyncCompletedEvent({
    actorUserId: params.actorUserId,
    subscriptionId: refreshed.id,
    businessId: refreshed.businessId,
    source,
  });

  return refreshed;
}

/**
 * Upsert subscription from Stripe checkout completion — canonical write path for checkout.
 */
export async function upsertSubscriptionFromCheckout(
  actorUserId: string,
  data: CheckoutSubscriptionData
): Promise<Subscription> {
  const tier = normalizeSubscriptionTier(data.tier, data.businessId);
  const subscriptionData = {
    userId: data.userId,
    businessId: data.businessId ?? null,
    tier,
    status: data.status,
    currentPeriodStart: data.currentPeriodStart,
    currentPeriodEnd: data.currentPeriodEnd,
    stripeSubscriptionId: data.stripeSubscriptionId,
    stripeCustomerId: data.stripeCustomerId,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
  };

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: data.userId,
      businessId: data.businessId ?? null,
    },
  });

  let subscription: Subscription;
  if (existing) {
    const previousTier = existing.tier;
    subscription = await prisma.subscription.update({
      where: { id: existing.id },
      data: subscriptionData,
    });
    await syncEntitlementCacheFromSubscription(subscription);
    await recordSubscriptionUpdated(actorUserId, subscription.id, {
      previousTier,
      newTier: subscription.tier,
      businessId: subscription.businessId,
      fields: ['checkout_sync'],
    });
    emitSubscriptionUpdatedEvent({
      actorUserId,
      subscriptionId: subscription.id,
      businessId: subscription.businessId,
      previousTier,
      newTier: subscription.tier,
      changedFields: ['checkout_sync'],
    });
  } else {
    subscription = await prisma.subscription.create({ data: subscriptionData });
    await syncEntitlementCacheFromSubscription(subscription);
    await recordSubscriptionCreated(actorUserId, subscription.id, {
      tier: subscription.tier,
      businessId: subscription.businessId,
    });
    emitSubscriptionCreatedEvent({
      actorUserId,
      subscriptionId: subscription.id,
      businessId: subscription.businessId,
      tier: subscription.tier,
    });
  }

  await recordBillingSyncCompleted(actorUserId, subscription.id, {
    source: 'checkout',
    businessId: subscription.businessId,
  });
  emitBillingSyncCompletedEvent({
    actorUserId,
    subscriptionId: subscription.id,
    businessId: subscription.businessId,
    source: 'checkout',
  });

  return subscription;
}

export async function resolveTierForBilling(
  userId: string,
  businessId?: string | null
): Promise<PlatformTier> {
  const sub = await resolveSubscription({ userId, businessId });
  if (!sub) return 'free';
  return normalizeTier(sub.tier, Boolean(businessId)) as PlatformTier;
}
