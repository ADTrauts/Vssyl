import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { FeatureGatingService } from '../featureGatingService';
import {
  recordBusinessEntitlementsUpdated,
  recordEntitlementGranted,
  recordSubscriptionTierChanged,
} from './entitlementActivityService';
import {
  emitBusinessEntitlementsUpdatedEvent,
  emitEntitlementGrantedEvent,
  emitSubscriptionTierChangedEvent,
} from './entitlementDomainEventService';
import {
  compareTiers,
  isPlatformTier,
  normalizeTier,
  type EffectiveEntitlements,
  type EntitlementContext,
  type EntitlementScope,
  type FeatureAccessResult,
  type ModuleAccessResult,
  type PlatformTier,
  type TierResolution,
} from './entitlementTypes';

export class EntitlementServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'EntitlementServiceError';
  }
}

function subscriptionPeriodBounds(): { currentPeriodStart: Date; currentPeriodEnd: Date } {
  const now = new Date();
  const currentPeriodStart = now;
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { currentPeriodStart, currentPeriodEnd };
}

async function findActiveSubscription(ctx: EntitlementContext) {
  if (ctx.businessId) {
    return prisma.subscription.findFirst({
      where: { businessId: ctx.businessId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }
  return prisma.subscription.findFirst({
    where: { userId: ctx.userId, businessId: null, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Resolve effective platform tier for a user or business context.
 * Subscription.tier is authoritative; Business.tier is a transitional read cache when no subscription exists.
 */
export async function resolveTier(ctx: EntitlementContext): Promise<TierResolution> {
  const subscription = await findActiveSubscription(ctx);

  if (subscription) {
    return {
      tier: normalizeTier(subscription.tier, Boolean(ctx.businessId)),
      source: 'subscription',
      subscriptionId: subscription.id,
      rawTier: subscription.tier,
      businessId: ctx.businessId,
      userId: ctx.userId,
    };
  }

  if (ctx.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: ctx.businessId },
      select: { tier: true },
    });
    if (business?.tier) {
      return {
        tier: normalizeTier(business.tier, true),
        source: 'business_cache',
        rawTier: business.tier,
        businessId: ctx.businessId,
        userId: ctx.userId,
      };
    }
  }

  return {
    tier: 'free',
    source: 'default',
    businessId: ctx.businessId,
    userId: ctx.userId,
  };
}

/** Convenience wrapper for business-scoped tier resolution. */
export async function resolveBusinessTier(
  businessId: string,
  userId = 'system'
): Promise<TierResolution> {
  return resolveTier({ userId, businessId });
}

/**
 * Resolve full entitlement snapshot including available feature keys for the effective tier.
 */
export async function resolveEffectiveEntitlements(
  ctx: EntitlementContext
): Promise<EffectiveEntitlements> {
  const resolution = await resolveTier(ctx);
  const scope: EntitlementScope = ctx.businessId ? 'business' : 'personal';
  const allFeatures = FeatureGatingService.getAllFeatures();
  const features: string[] = [];

  for (const [featureKey, feature] of Object.entries(allFeatures)) {
    if (scope === 'business' && feature.category === 'personal' && feature.module !== 'core') {
      continue;
    }
    if (scope === 'personal' && feature.category === 'business') {
      continue;
    }
    if (compareTiers(resolution.tier, feature.requiredTier)) {
      features.push(featureKey);
    }
  }

  return {
    tier: resolution.tier,
    source: resolution.source,
    subscriptionId: resolution.subscriptionId,
    scope,
    userId: ctx.userId,
    businessId: ctx.businessId,
    features,
  };
}

export async function resolveUserEntitlements(userId: string): Promise<EffectiveEntitlements> {
  return resolveEffectiveEntitlements({ userId });
}

export async function resolveBusinessEntitlements(
  userId: string,
  businessId: string
): Promise<EffectiveEntitlements> {
  return resolveEffectiveEntitlements({ userId, businessId });
}

export async function hasFeature(
  ctx: EntitlementContext,
  featureKey: string
): Promise<FeatureAccessResult> {
  const resolution = await resolveTier(ctx);
  const feature = FeatureGatingService.getFeatureConfig(featureKey);
  if (!feature) {
    return { allowed: false, tier: resolution.tier, reason: 'Feature not found' };
  }
  const allowed = compareTiers(resolution.tier, feature.requiredTier);
  return {
    allowed,
    tier: resolution.tier,
    reason: allowed
      ? undefined
      : `Requires ${feature.requiredTier} tier, current tier: ${resolution.tier}`,
  };
}

export async function hasModuleAccess(
  ctx: EntitlementContext,
  moduleId: string
): Promise<ModuleAccessResult> {
  const resolution = await resolveTier(ctx);
  const access = await FeatureGatingService.checkModuleAccess(
    ctx.userId,
    moduleId,
    ctx.businessId
  );
  return {
    allowed: access.hasAccess,
    tier: resolution.tier,
    missingFeatures: access.missingFeatures,
    availableFeatures: access.availableFeatures,
  };
}

/**
 * Sync Business.tier derived cache from authoritative subscription tier.
 * Business.tier is read-only from the entitlement perspective — never a write SoR.
 */
export async function syncBusinessTierCache(
  businessId: string,
  tier: PlatformTier
): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: { tier },
  });
}

async function resolveBillingUserId(businessId: string): Promise<string> {
  const adminMember = await prisma.businessMember.findFirst({
    where: { businessId, isActive: true, role: 'ADMIN' },
    orderBy: { joinedAt: 'asc' },
    select: { userId: true },
  });
  if (adminMember) return adminMember.userId;

  const anyMember = await prisma.businessMember.findFirst({
    where: { businessId, isActive: true },
    orderBy: { joinedAt: 'asc' },
    select: { userId: true },
  });
  if (anyMember) return anyMember.userId;

  throw new EntitlementServiceError('No active business member found for subscription billing user', 404);
}

/**
 * Authoritative tier write path for admin overrides and entitlement mutations.
 * Writes Subscription.tier and syncs Business.tier cache.
 */
export async function setBusinessTierAuthority(params: {
  actorUserId: string;
  businessId: string;
  tier: PlatformTier;
}): Promise<{ subscriptionId: string; tier: PlatformTier; businessId: string }> {
  const { actorUserId, businessId, tier } = params;

  if (!isPlatformTier(tier)) {
    throw new EntitlementServiceError('Invalid tier', 400);
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) {
    throw new EntitlementServiceError('Business not found', 404);
  }

  const billingUserId = await resolveBillingUserId(businessId);
  const existing = await prisma.subscription.findFirst({
    where: { businessId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  const { currentPeriodStart, currentPeriodEnd } = subscriptionPeriodBounds();
  let subscriptionId: string;
  const previousTier = existing?.tier;

  if (existing) {
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: { tier },
    });
    subscriptionId = updated.id;
  } else {
    const created = await prisma.subscription.create({
      data: {
        userId: billingUserId,
        businessId,
        tier,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
    });
    subscriptionId = created.id;
  }

  await syncBusinessTierCache(businessId, tier);

  await recordSubscriptionTierChanged(actorUserId, subscriptionId, {
    previousTier,
    newTier: tier,
    businessId,
  });
  await recordEntitlementGranted(actorUserId, businessId, { tier, businessId });
  await recordBusinessEntitlementsUpdated(actorUserId, businessId, { tier, subscriptionId });

  emitSubscriptionTierChangedEvent({
    actorUserId,
    subscriptionId,
    businessId,
    previousTier,
    newTier: tier,
  });
  emitEntitlementGrantedEvent({
    actorUserId,
    entityId: businessId,
    businessId,
    tier,
  });
  emitBusinessEntitlementsUpdatedEvent({
    actorUserId,
    businessId,
    tier,
    subscriptionId,
  });

  void logger.info('Business tier authority updated', {
    operation: 'entitlement_set_business_tier',
    businessId,
    subscriptionId,
    tier,
    previousTier,
    actorUserId,
  });

  return { subscriptionId, tier, businessId };
}
