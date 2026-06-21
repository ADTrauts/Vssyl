import { emitModuleActivityEvent } from '../moduleActivityService';
import type { PlatformTier } from './entitlementTypes';

const MODULE_ID = 'account';

export async function recordSubscriptionTierChanged(
  actorUserId: string,
  subscriptionId: string,
  params: { previousTier?: string; newTier: PlatformTier; businessId?: string }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'entitlement.subscription_tier_changed',
    targetType: 'subscription',
    targetId: subscriptionId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId,
    metadata: {
      previousTier: params.previousTier,
      newTier: params.newTier,
    },
  });
}

export async function recordEntitlementGranted(
  actorUserId: string,
  targetId: string,
  params: { tier: PlatformTier; businessId?: string; featureKey?: string }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'entitlement.granted',
    targetType: params.businessId ? 'business' : 'user',
    targetId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId,
    metadata: {
      tier: params.tier,
      featureKey: params.featureKey,
    },
  });
}

export async function recordEntitlementRevoked(
  actorUserId: string,
  targetId: string,
  params: { previousTier?: string; businessId?: string; featureKey?: string }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'entitlement.revoked',
    targetType: params.businessId ? 'business' : 'user',
    targetId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId,
    metadata: {
      previousTier: params.previousTier,
      featureKey: params.featureKey,
    },
  });
}

export async function recordBusinessEntitlementsUpdated(
  actorUserId: string,
  businessId: string,
  params: { tier: PlatformTier; subscriptionId?: string }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'entitlement.business_updated',
    targetType: 'business',
    targetId: businessId,
    visibilityScope: 'business',
    businessId,
    metadata: {
      tier: params.tier,
      subscriptionId: params.subscriptionId,
    },
  });
}
