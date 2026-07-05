import { prisma } from '../lib/prisma';
import { stripe, isStripeConfigured } from '../config/stripe';
import { logger } from '../lib/logger';

const TIER_TO_PRODUCT_ID: Record<string, string> = {
  pro: 'prod_pro',
  business_basic: 'prod_business_basic',
  business_advanced: 'prod_business_advanced',
  enterprise: 'prod_enterprise',
};

export const PRO_CANONICAL_MONTHLY = 49.99;
export const PRO_CANONICAL_YEARLY = 499.99;

export interface StripePriceSyncResult {
  alignedPro: { monthly: number; yearly: number };
  synced: number;
  skipped: number;
  errors: number;
  details: Array<{ tier: string; billingCycle: string; stripePriceId?: string; status: string }>;
}

export async function alignProPricingInDatabase(): Promise<{ monthly: number; yearly: number }> {
  const monthly = await prisma.pricingConfig.updateMany({
    where: { tier: 'pro', billingCycle: 'monthly', isActive: true },
    data: { basePrice: PRO_CANONICAL_MONTHLY },
  });
  const yearly = await prisma.pricingConfig.updateMany({
    where: { tier: 'pro', billingCycle: 'yearly', isActive: true },
    data: { basePrice: PRO_CANONICAL_YEARLY },
  });
  return { monthly: monthly.count, yearly: yearly.count };
}

export async function syncStripePriceIdsToDatabase(): Promise<StripePriceSyncResult> {
  if (!isStripeConfigured() || !stripe) {
    throw new Error('Stripe is not configured');
  }

  const alignedPro = await alignProPricingInDatabase();
  const details: StripePriceSyncResult['details'] = [];
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  const pricingConfigs = await prisma.pricingConfig.findMany({
    where: { isActive: true, tier: { not: 'free' } },
    orderBy: [{ tier: 'asc' }, { billingCycle: 'asc' }],
  });

  for (const config of pricingConfigs) {
    const productId = TIER_TO_PRODUCT_ID[config.tier];
    if (!productId) {
      skipped++;
      details.push({ tier: config.tier, billingCycle: config.billingCycle, status: 'skipped_no_product_mapping' });
      continue;
    }

    try {
      const prices = await stripe.prices.list({ product: productId, active: true });
      const interval = config.billingCycle === 'monthly' ? 'month' : 'year';
      const expectedAmount = Math.round(config.basePrice * 100);
      const intervalPrices = prices.data.filter((p) => p.recurring?.interval === interval);
      const matchingPrice = intervalPrices
        .slice()
        .sort((a, b) => {
          const aDiff = Math.abs((a.unit_amount ?? 0) - expectedAmount);
          const bDiff = Math.abs((b.unit_amount ?? 0) - expectedAmount);
          return aDiff - bDiff;
        })[0];

      if (!matchingPrice) {
        skipped++;
        details.push({ tier: config.tier, billingCycle: config.billingCycle, status: 'skipped_no_matching_price' });
        continue;
      }

      const actualAmount = matchingPrice.unit_amount ?? 0;
      if (Math.abs(expectedAmount - actualAmount) > 1) {
        void logger.warn('Price mismatch during Stripe sync; using closest Stripe price', {
          operation: 'pricing_stripe_sync_amount_mismatch',
          tier: config.tier,
          billingCycle: config.billingCycle,
          databaseAmount: config.basePrice,
          stripeAmount: actualAmount / 100,
          stripePriceId: matchingPrice.id,
        });
      }

      if (config.stripePriceId === matchingPrice.id) {
        skipped++;
        details.push({
          tier: config.tier,
          billingCycle: config.billingCycle,
          stripePriceId: matchingPrice.id,
          status: 'already_synced',
        });
        continue;
      }

      await prisma.pricingConfig.update({
        where: { id: config.id },
        data: { stripePriceId: matchingPrice.id },
      });
      synced++;
      details.push({
        tier: config.tier,
        billingCycle: config.billingCycle,
        stripePriceId: matchingPrice.id,
        status: 'synced',
      });
    } catch (error: unknown) {
      errors++;
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Failed to sync Stripe price for tier', {
        operation: 'pricing_stripe_sync_error',
        tier: config.tier,
        billingCycle: config.billingCycle,
        error: { message: err.message, stack: err.stack },
      });
      details.push({ tier: config.tier, billingCycle: config.billingCycle, status: `error:${err.message}` });
    }
  }

  return { alignedPro, synced, skipped, errors, details };
}
