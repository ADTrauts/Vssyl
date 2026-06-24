import { prisma } from '../lib/prisma.js';
import {
  getActiveBusinessModuleSubscription,
  moduleRequiresBusinessSubscription,
  hasActiveBusinessModuleSubscription,
} from '../services/businessModuleSubscriptionService.js';

export interface BusinessBillingProbeResult {
  ok: boolean;
  moduleId: string;
  businessId: string;
  pricingTier: string;
  requiresBusinessSubscription: boolean;
  hasBusinessSubscriptionRow: boolean;
  subscriptionStatus?: string;
  subscriptionTier?: string;
  installReady: boolean;
  runtimeReady: boolean;
  blockers: string[];
}

export async function probeBusinessModuleBilling(params: {
  moduleId: string;
  businessId: string;
}): Promise<BusinessBillingProbeResult> {
  const blockers: string[] = [];

  const mod = await prisma.module.findUnique({
    where: { id: params.moduleId },
    select: {
      id: true,
      pricingTier: true,
      isProprietary: true,
      status: true,
      basePrice: true,
      stripePriceId: true,
    },
  });

  if (!mod) {
    return {
      ok: false,
      moduleId: params.moduleId,
      businessId: params.businessId,
      pricingTier: 'unknown',
      requiresBusinessSubscription: false,
      hasBusinessSubscriptionRow: false,
      installReady: false,
      runtimeReady: false,
      blockers: ['module_not_found'],
    };
  }

  if (mod.status !== 'APPROVED') {
    blockers.push('module_not_approved');
  }

  const requiresBusinessSubscription = moduleRequiresBusinessSubscription(mod);
  const sub = await getActiveBusinessModuleSubscription(params.businessId, params.moduleId);
  const hasActive = await hasActiveBusinessModuleSubscription(params.businessId, params.moduleId);

  const installation = await prisma.businessModuleInstallation.findUnique({
    where: {
      moduleId_businessId: {
        moduleId: params.moduleId,
        businessId: params.businessId,
      },
    },
    select: { enabled: true },
  });

  if (requiresBusinessSubscription && !hasActive) {
    blockers.push('missing_active_business_subscription');
    if (mod.pricingTier !== 'free' && !mod.stripePriceId) {
      blockers.push('stripe_price_not_configured');
    }
  }

  if (!installation) {
    blockers.push('not_installed');
  } else if (installation.enabled === false) {
    blockers.push('installation_disabled');
  }

  const installReady =
    mod.status === 'APPROVED' && (!requiresBusinessSubscription || hasActive);
  const runtimeReady = installReady && Boolean(installation?.enabled !== false);

  return {
    ok: blockers.length === 0,
    moduleId: params.moduleId,
    businessId: params.businessId,
    pricingTier: mod.pricingTier,
    requiresBusinessSubscription,
    hasBusinessSubscriptionRow: Boolean(sub),
    subscriptionStatus: sub?.status,
    subscriptionTier: sub?.tier,
    installReady,
    runtimeReady,
    blockers,
  };
}
