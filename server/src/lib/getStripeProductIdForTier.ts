/**
 * Resolve Stripe product ID for a tier.
 * Built-in tiers use STRIPE_PRODUCTS; admin-created tiers use SystemConfig (tier_product_${tier}).
 */
import { STRIPE_PRODUCTS } from '../config/stripe';
import { prisma } from './prisma';

const BUILTIN_TIER_TO_PRODUCT: Record<string, string> = {
  pro: STRIPE_PRODUCTS.PRO,
  business_basic: STRIPE_PRODUCTS.BUSINESS_BASIC,
  business_advanced: STRIPE_PRODUCTS.BUSINESS_ADVANCED,
  enterprise: STRIPE_PRODUCTS.ENTERPRISE,
};

const TIER_PRODUCT_CONFIG_KEY_PREFIX = 'tier_product_';

export async function getStripeProductIdForTier(tier: string): Promise<string | null> {
  const builtin = BUILTIN_TIER_TO_PRODUCT[tier];
  if (builtin) return builtin;

  const config = await prisma.systemConfig.findUnique({
    where: { configKey: `${TIER_PRODUCT_CONFIG_KEY_PREFIX}${tier}` },
  });
  if (config && typeof config.configValue === 'string') return config.configValue;
  if (config && config.configValue && typeof (config.configValue as { stripeProductId?: string }).stripeProductId === 'string') {
    return (config.configValue as { stripeProductId: string }).stripeProductId;
  }
  return null;
}

export function getTierProductConfigKey(tier: string): string {
  return `${TIER_PRODUCT_CONFIG_KEY_PREFIX}${tier}`;
}
