import { emitDomainEvent } from '../../events/emitDomainEvent';
import { DOMAIN_EVENT_TYPES } from '../../events/domainEventRegistry';

export function emitSubscriptionCreatedEvent(params: {
  actorUserId: string;
  subscriptionId: string;
  businessId?: string | null;
  tier: string;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.BILLING_SUBSCRIPTION_CREATED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Subscription',
    entityId: params.subscriptionId,
    action: 'created',
    metadata: { tier: params.tier },
  });
}

export function emitSubscriptionUpdatedEvent(params: {
  actorUserId: string;
  subscriptionId: string;
  businessId?: string | null;
  previousTier?: string;
  newTier?: string;
  changedFields?: string[];
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.BILLING_SUBSCRIPTION_UPDATED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Subscription',
    entityId: params.subscriptionId,
    action: 'updated',
    metadata: {
      previousTier: params.previousTier,
      newTier: params.newTier,
      changedFields: params.changedFields,
    },
  });
}

export function emitSubscriptionCancelledEvent(params: {
  actorUserId: string;
  subscriptionId: string;
  businessId?: string | null;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.BILLING_SUBSCRIPTION_CANCELLED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Subscription',
    entityId: params.subscriptionId,
    action: 'cancelled',
  });
}

export function emitSubscriptionResumedEvent(params: {
  actorUserId: string;
  subscriptionId: string;
  businessId?: string | null;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.BILLING_SUBSCRIPTION_RESUMED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Subscription',
    entityId: params.subscriptionId,
    action: 'resumed',
  });
}

export function emitBillingSyncCompletedEvent(params: {
  actorUserId: string;
  subscriptionId: string;
  businessId?: string | null;
  source: string;
}): void {
  emitDomainEvent({
    type: DOMAIN_EVENT_TYPES.BILLING_SYNC_COMPLETED,
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    entityType: 'Subscription',
    entityId: params.subscriptionId,
    action: 'sync_completed',
    metadata: { source: params.source },
  });
}
