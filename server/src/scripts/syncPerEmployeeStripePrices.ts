/**
 * Sync existing per-employee prices to Stripe
 * 
 * This script:
 * 1. Finds all pricing configs with perEmployeePrice but no perEmployeeStripePriceId
 * 2. Creates Stripe prices for them
 * 3. Updates the database with the new Stripe price IDs
 * 
 * Usage:
 *   pnpm stripe:sync-per-employee
 * 
 * Requirements:
 *   - STRIPE_SECRET_KEY environment variable set in .env file
 *   - Pricing configs with perEmployeePrice already set in database
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { prisma } from '../lib/prisma';
import { stripe, isStripeConfigured, STRIPE_PRODUCTS } from '../config/stripe';
import { StripeService } from '../services/stripeService';
import { logger } from '../lib/logger';

if (!isStripeConfigured() || !stripe) {
  void logger.error('STRIPE_SECRET_KEY environment variable is required', {
    operation: 'sync_per_employee_prices_missing_secret',
  });
  void logger.info('Set STRIPE_SECRET_KEY in server/.env', {
    operation: 'sync_per_employee_prices_missing_secret_help',
  });
  process.exit(1);
}

async function syncPerEmployeePrices() {
  void logger.info('Syncing per-employee prices to Stripe', {
    operation: 'sync_per_employee_prices_start',
  });

  const keyPreview = process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'unknown';
  const isTest = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;
  void logger.info('Using Stripe key and environment', {
    operation: 'sync_per_employee_prices_key_info',
    keyPreview,
    environment: isTest ? 'TEST' : 'LIVE',
  });

  // Map tier to Stripe product ID
  const tierToProductId: Record<string, string> = {
    pro: STRIPE_PRODUCTS.PRO,
    business_basic: STRIPE_PRODUCTS.BUSINESS_BASIC,
    business_advanced: STRIPE_PRODUCTS.BUSINESS_ADVANCED,
    enterprise: STRIPE_PRODUCTS.ENTERPRISE,
  };

  // Find all pricing configs with perEmployeePrice but no perEmployeeStripePriceId
  const pricingConfigs = await prisma.pricingConfig.findMany({
    where: {
      isActive: true,
      perEmployeePrice: { not: null },
      OR: [
        { perEmployeeStripePriceId: null },
        { perEmployeeStripePriceId: '' },
      ],
    },
    orderBy: [
      { tier: 'asc' },
      { billingCycle: 'asc' },
    ],
  });

  void logger.info('Found pricing configs needing per-employee Stripe prices', {
    operation: 'sync_per_employee_prices_configs_found',
    count: pricingConfigs.length,
  });

  if (pricingConfigs.length === 0) {
    void logger.info('All per-employee prices are already synced', {
      operation: 'sync_per_employee_prices_noop',
    });
    return;
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const config of pricingConfigs) {
    const productId = tierToProductId[config.tier];
    if (!productId) {
      void logger.warn('No product ID mapping for tier', {
        operation: 'sync_per_employee_prices_missing_product_mapping',
        tier: config.tier,
      });
      skipped++;
      continue;
    }

    if (!config.perEmployeePrice || config.perEmployeePrice <= 0) {
      void logger.warn('Invalid per-employee price', {
        operation: 'sync_per_employee_prices_invalid_amount',
        tier: config.tier,
        billingCycle: config.billingCycle,
        perEmployeePrice: config.perEmployeePrice,
      });
      skipped++;
      continue;
    }

    try {
      void logger.info('Creating per-employee Stripe price', {
        operation: 'sync_per_employee_prices_create_start',
        tier: config.tier,
        billingCycle: config.billingCycle,
      });

      const interval = config.billingCycle === 'monthly' ? 'month' : 'year';
      const amountInCents = Math.round(config.perEmployeePrice * 100);

      // Create Stripe price
      const perEmployeePrice = await StripeService.createPrice(
        productId,
        amountInCents,
        'usd',
        {
          interval: interval as 'month' | 'year',
          metadata: {
            type: 'per_employee',
            tier: config.tier,
            billingCycle: config.billingCycle,
          },
        }
      );

      // Update database with Stripe price ID
      await prisma.pricingConfig.update({
        where: { id: config.id },
        data: { perEmployeeStripePriceId: perEmployeePrice.id },
      });

      void logger.info('Created per-employee Stripe price', {
        operation: 'sync_per_employee_prices_create_success',
        tier: config.tier,
        billingCycle: config.billingCycle,
        stripePriceId: perEmployeePrice.id,
        amount: config.perEmployeePrice,
        interval,
      });
      created++;

      await logger.info('Created per-employee Stripe price', {
        operation: 'sync_per_employee_stripe_price',
        tier: config.tier,
        billingCycle: config.billingCycle,
        stripePriceId: perEmployeePrice.id,
        amount: config.perEmployeePrice,
      });
    } catch (error: unknown) {
      errors++;
      const err = error as Error;
      void logger.error('Failed to create per-employee Stripe price', {
        operation: 'sync_per_employee_prices_create_error',
        tier: config.tier,
        billingCycle: config.billingCycle,
        error: { message: err.message, stack: err.stack },
      });
      
      await logger.error('Failed to create per-employee Stripe price', {
        operation: 'sync_per_employee_stripe_price',
        tier: config.tier,
        billingCycle: config.billingCycle,
        error: {
          message: err.message,
          stack: err.stack,
        },
      });
    }

  }

  void logger.info('Per-employee Stripe price sync summary', {
    operation: 'sync_per_employee_prices_summary',
    created,
    skipped,
    errors,
  });

  if (created > 0) {
    void logger.info('Per-employee prices synced successfully', {
      operation: 'sync_per_employee_prices_done_success',
      created,
    });
    void logger.info('Verify results with pnpm stripe:list-per-employee', {
      operation: 'sync_per_employee_prices_done_help',
    });
  }
}

// Run if called directly
if (require.main === module) {
  syncPerEmployeePrices()
    .then(() => {
      void logger.info('Done syncing per-employee Stripe prices', {
        operation: 'sync_per_employee_prices_done',
      });
      process.exit(0);
    })
    .catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Unexpected error syncing per-employee Stripe prices', {
        operation: 'sync_per_employee_prices_unhandled',
        error: { message: err.message, stack: err.stack },
      });
      process.exit(1);
    });
}

export { syncPerEmployeePrices };

