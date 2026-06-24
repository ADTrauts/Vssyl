import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { asRecordJson } from '../controllers/module/moduleShared.js';
import {
  moduleScopeSupportsInstall,
  resolveEffectiveModuleScope,
} from '../marketplace/moduleScopeService.js';

export type BusinessModuleSubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid';

export interface BusinessModuleBillingModule {
  pricingTier?: string | null;
  isProprietary?: boolean | null;
  status?: string;
}

export interface BusinessModuleEntitlementResult {
  allowed: boolean;
  statusCode?: 400 | 402 | 403 | 404;
  reason?: string;
  requiresSubscription?: boolean;
}

/** Paid partner modules require BusinessModuleSubscription; proprietary uses platform tier at install. */
export function moduleRequiresBusinessSubscription(module: BusinessModuleBillingModule): boolean {
  return Boolean(
    module.pricingTier && module.pricingTier !== 'free' && !module.isProprietary
  );
}

export async function getActiveBusinessModuleSubscription(
  businessId: string,
  moduleId: string
) {
  return prisma.businessModuleSubscription.findUnique({
    where: {
      moduleId_businessId: { moduleId, businessId },
    },
  });
}

export async function hasActiveBusinessModuleSubscription(
  businessId: string,
  moduleId: string
): Promise<boolean> {
  const sub = await getActiveBusinessModuleSubscription(businessId, moduleId);
  return sub?.status === 'active';
}

/**
 * Idempotent free-tier business subscription (amount 0).
 * Called on business install for free partner modules.
 */
export async function ensureFreeBusinessModuleSubscription(params: {
  businessId: string;
  moduleId: string;
  actorUserId: string;
}): Promise<{ created: boolean; subscriptionId: string }> {
  const existing = await getActiveBusinessModuleSubscription(
    params.businessId,
    params.moduleId
  );
  if (existing?.status === 'active') {
    return { created: false, subscriptionId: existing.id };
  }

  const subscription = await prisma.businessModuleSubscription.upsert({
    where: {
      moduleId_businessId: {
        moduleId: params.moduleId,
        businessId: params.businessId,
      },
    },
    create: {
      moduleId: params.moduleId,
      businessId: params.businessId,
      tier: 'free',
      amount: 0,
      status: 'active',
    },
    update: {
      tier: 'free',
      amount: 0,
      status: 'active',
    },
  });

  void logger.info('Business module subscription ensured (free)', {
    operation: 'business_module_subscription_ensure_free',
    moduleId: params.moduleId,
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    subscriptionId: subscription.id,
    created: !existing,
  });

  return { created: !existing, subscriptionId: subscription.id };
}

/**
 * Upsert paid business subscription row (idempotent on moduleId+businessId).
 */
export async function upsertPaidBusinessModuleSubscription(params: {
  businessId: string;
  moduleId: string;
  tier: string;
  amount: number;
  status?: BusinessModuleSubscriptionStatus;
  stripeSubscriptionId?: string | null;
  actorUserId?: string;
}): Promise<{ subscriptionId: string; created: boolean }> {
  const existing = await getActiveBusinessModuleSubscription(
    params.businessId,
    params.moduleId
  );

  const subscription = await prisma.businessModuleSubscription.upsert({
    where: {
      moduleId_businessId: {
        moduleId: params.moduleId,
        businessId: params.businessId,
      },
    },
    create: {
      moduleId: params.moduleId,
      businessId: params.businessId,
      tier: params.tier,
      amount: params.amount,
      status: params.status ?? 'active',
      stripeSubscriptionId: params.stripeSubscriptionId ?? undefined,
    },
    update: {
      tier: params.tier,
      amount: params.amount,
      status: params.status ?? 'active',
      ...(params.stripeSubscriptionId !== undefined
        ? { stripeSubscriptionId: params.stripeSubscriptionId }
        : {}),
    },
  });

  void logger.info('Business module subscription upserted', {
    operation: 'business_module_subscription_upsert',
    moduleId: params.moduleId,
    businessId: params.businessId,
    tier: params.tier,
    amount: params.amount,
    status: params.status ?? 'active',
    actorUserId: params.actorUserId,
    subscriptionId: subscription.id,
  });

  return { subscriptionId: subscription.id, created: !existing };
}

export async function updateBusinessModuleSubscriptionStatusByStripeId(
  stripeSubscriptionId: string,
  status: BusinessModuleSubscriptionStatus
): Promise<void> {
  await prisma.businessModuleSubscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status },
  });
}

/**
 * Central business-scoped entitlement check for install/runtime/bridge paths.
 */
export async function evaluateBusinessModuleEntitlement(params: {
  businessId: string;
  moduleId: string;
  module: BusinessModuleBillingModule;
  installation?: { enabled?: boolean } | null;
  userId?: string;
}): Promise<BusinessModuleEntitlementResult> {
  if (params.module.status && params.module.status !== 'APPROVED') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Module not approved',
    };
  }

  const modRow = await prisma.module.findUnique({
    where: { id: params.moduleId },
    select: { manifest: true },
  });
  const scopeResolved = resolveEffectiveModuleScope(
    asRecordJson(modRow?.manifest),
    params.moduleId
  );
  if (!scopeResolved || !moduleScopeSupportsInstall(scopeResolved.moduleScope, 'business')) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Module scope does not support business entitlement',
    };
  }

  if (!params.installation) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Module not installed for business',
    };
  }

  if (params.installation.enabled === false) {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Module disabled for business',
    };
  }

  if (params.userId) {
    const membership = await prisma.businessMember.findFirst({
      where: {
        businessId: params.businessId,
        userId: params.userId,
        isActive: true,
      },
    });
    if (!membership) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Access denied for this business',
      };
    }
  }

  if (!moduleRequiresBusinessSubscription(params.module)) {
    return { allowed: true };
  }

  const active = await hasActiveBusinessModuleSubscription(
    params.businessId,
    params.moduleId
  );
  if (!active) {
    return {
      allowed: false,
      statusCode: 402,
      reason: 'Active subscription required',
      requiresSubscription: true,
    };
  }

  const sub = await getActiveBusinessModuleSubscription(
    params.businessId,
    params.moduleId
  );
  if (sub && sub.status !== 'active') {
    return {
      allowed: false,
      statusCode: 402,
      reason: `Subscription ${sub.status}`,
      requiresSubscription: true,
    };
  }

  return { allowed: true };
}
