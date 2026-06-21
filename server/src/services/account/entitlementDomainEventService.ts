import { emitDomainEvent } from '../../events/emitDomainEvent';
import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';
import type { PlatformTier } from './entitlementTypes';

export function emitSubscriptionTierChangedEvent(params: {
  actorUserId: string;
  subscriptionId: string;
  businessId?: string | null;
  previousTier?: string;
  newTier: PlatformTier;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.ENTITLEMENT_SUBSCRIPTION_TIER_CHANGED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Subscription',
    entityId: params.subscriptionId,
    action: 'tier_changed',
    metadata: {
      previousTier: params.previousTier,
      newTier: params.newTier,
    },
  });
}

export function emitEntitlementGrantedEvent(params: {
  actorUserId: string;
  entityId: string;
  businessId?: string | null;
  tier: PlatformTier;
  featureKey?: string;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.ENTITLEMENT_GRANTED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: params.businessId ? 'Business' : 'User',
    entityId: params.entityId,
    action: 'granted',
    metadata: {
      tier: params.tier,
      featureKey: params.featureKey,
    },
  });
}

export function emitEntitlementRevokedEvent(params: {
  actorUserId: string;
  entityId: string;
  businessId?: string | null;
  previousTier?: string;
  featureKey?: string;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.ENTITLEMENT_REVOKED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: params.businessId ? 'Business' : 'User',
    entityId: params.entityId,
    action: 'revoked',
    metadata: {
      previousTier: params.previousTier,
      featureKey: params.featureKey,
    },
  });
}

export function emitBusinessEntitlementsUpdatedEvent(params: {
  actorUserId: string;
  businessId: string;
  tier: PlatformTier;
  subscriptionId?: string;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.ENTITLEMENT_BUSINESS_UPDATED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Business',
    entityId: params.businessId,
    action: 'entitlements_updated',
    metadata: {
      tier: params.tier,
      subscriptionId: params.subscriptionId,
    },
  });
}
