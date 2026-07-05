/**
 * Sync Stripe price IDs to database pricing records
 * 
 * This script:
 * 1. Fetches all Stripe products and prices
 * 2. Matches them to database pricing records by tier and billing cycle
 * 3. Updates database with stripePriceId values
 * 
 * Usage:
 *   pnpm stripe:sync
 * 
 * Requirements:
 *   - STRIPE_SECRET_KEY environment variable set in .env file
 *   - Pricing records already exist in database (run seedPricing.ts first)
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '../lib/prisma';
import { stripe, isStripeConfigured } from '../config/stripe';
import { logger } from '../lib/logger';

async function syncStripePrices() {
  if (!isStripeConfigured() || !stripe) {
    void logger.error('Stripe is not configured', { operation: 'sync_stripe_prices_not_configured' });
    void logger.info('Set STRIPE_SECRET_KEY environment variable', { operation: 'sync_stripe_prices_not_configured_help' });
    process.exit(1);
  }

  void logger.info('Syncing Stripe prices to database', { operation: 'sync_stripe_prices_start' });

  // Map of tier names (database) to product IDs (Stripe)
  const tierToProductId: Record<string, string> = {
    'pro': 'prod_pro',
    'business_basic': 'prod_business_basic',
    'business_advanced': 'prod_business_advanced',
    'enterprise': 'prod_enterprise',
  };

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  // Get all active pricing configs from database
  const pricingConfigs = await prisma.pricingConfig.findMany({
    where: {
      isActive: true,
      tier: { not: 'free' }, // Free tier doesn't need Stripe
    },
    orderBy: [
      { tier: 'asc' },
      { billingCycle: 'asc' },
    ],
  });

  void logger.info('Found pricing configs to sync', {
    operation: 'sync_stripe_prices_configs_found',
    count: pricingConfigs.length,
  });

  for (const config of pricingConfigs) {
    const productId = tierToProductId[config.tier];
    if (!productId) {
      void logger.warn('No product ID mapping for tier', {
        operation: 'sync_stripe_prices_missing_product_mapping',
        tier: config.tier,
      });
      skipped++;
      continue;
    }

    try {
      // Get all prices for this product from Stripe
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      // Find matching price by interval and base amount (avoid per-employee add-on prices)
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
        void logger.warn('No Stripe price found for pricing config', {
          operation: 'sync_stripe_prices_missing_matching_price',
          tier: config.tier,
          billingCycle: config.billingCycle,
          productId,
          interval,
        });
        skipped++;
        continue;
      }

      // Warn if amount doesn't match (still sync the ID - display price is in DB, Stripe ID is for checkout)
      const actualAmount = matchingPrice.unit_amount || 0;
      if (Math.abs(expectedAmount - actualAmount) > 1) {
        void logger.warn('Price mismatch detected; syncing Stripe ID anyway', {
          operation: 'sync_stripe_prices_amount_mismatch',
          tier: config.tier,
          billingCycle: config.billingCycle,
          databaseAmount: config.basePrice,
          stripeAmount: actualAmount / 100,
        });
      }

      // Check if already synced
      if (config.stripePriceId === matchingPrice.id) {
        void logger.debug('Pricing config already synced', {
          operation: 'sync_stripe_prices_already_synced',
          tier: config.tier,
          billingCycle: config.billingCycle,
          stripePriceId: matchingPrice.id,
        });
        skipped++;
        continue;
      }

      // Update database with Stripe price ID
      await prisma.pricingConfig.update({
        where: { id: config.id },
        data: { stripePriceId: matchingPrice.id },
      });

      void logger.info('Synced Stripe price ID to pricing config', {
        operation: 'sync_stripe_prices_synced',
        tier: config.tier,
        billingCycle: config.billingCycle,
        stripePriceId: matchingPrice.id,
      });
      synced++;
    } catch (error: unknown) {
      const err = error as Error;
      void logger.error('Error syncing pricing config', {
        operation: 'sync_stripe_prices_error',
        tier: config.tier,
        billingCycle: config.billingCycle,
        error: { message: err.message, stack: err.stack },
      });
      errors++;
    }
  }

  void logger.info('Stripe price sync summary', {
    operation: 'sync_stripe_prices_summary',
    synced,
    skipped,
    errors,
    total: pricingConfigs.length,
  });

  if (synced > 0) {
    void logger.info('Stripe price sync completed successfully', {
      operation: 'sync_stripe_prices_done_success',
      synced,
    });
  } else if (errors === 0) {
    void logger.info('All Stripe prices already synced or skipped', {
      operation: 'sync_stripe_prices_done_no_changes',
    });
  } else {
    void logger.warn('Stripe price sync completed with errors', {
      operation: 'sync_stripe_prices_done_with_errors',
      errors,
    });
  }
}

// Run if called directly
if (require.main === module) {
  syncStripePrices()
    .catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Unexpected error syncing Stripe prices', {
        operation: 'sync_stripe_prices_unhandled',
        error: { message: err.message, stack: err.stack },
      });
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { syncStripePrices };

