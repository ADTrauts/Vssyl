import { emitModuleActivityEvent } from '../moduleActivityService';

const MODULE_ID = 'account';

export async function recordSubscriptionCreated(
  actorUserId: string,
  subscriptionId: string,
  params: { tier: string; businessId?: string | null }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'billing.subscription_created',
    targetType: 'subscription',
    targetId: subscriptionId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId ?? undefined,
    metadata: { tier: params.tier },
  });
}

export async function recordSubscriptionUpdated(
  actorUserId: string,
  subscriptionId: string,
  params: { previousTier?: string; newTier?: string; businessId?: string | null; fields?: string[] }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'billing.subscription_updated',
    targetType: 'subscription',
    targetId: subscriptionId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId ?? undefined,
    metadata: {
      previousTier: params.previousTier,
      newTier: params.newTier,
      fields: params.fields,
    },
  });
}

export async function recordSubscriptionCancelled(
  actorUserId: string,
  subscriptionId: string,
  params: { businessId?: string | null }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'billing.subscription_cancelled',
    targetType: 'subscription',
    targetId: subscriptionId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId ?? undefined,
  });
}

export async function recordSubscriptionResumed(
  actorUserId: string,
  subscriptionId: string,
  params: { businessId?: string | null }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'billing.subscription_resumed',
    targetType: 'subscription',
    targetId: subscriptionId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId ?? undefined,
  });
}

export async function recordBillingSyncCompleted(
  actorUserId: string,
  subscriptionId: string,
  params: { source: string; businessId?: string | null }
): Promise<void> {
  await emitModuleActivityEvent({
    actorUserId,
    moduleId: MODULE_ID,
    action: 'billing.sync_completed',
    targetType: 'subscription',
    targetId: subscriptionId,
    visibilityScope: params.businessId ? 'business' : 'personal',
    businessId: params.businessId ?? undefined,
    metadata: { source: params.source },
  });
}
