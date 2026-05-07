/**
 * List all per-employee Stripe prices
 * 
 * This script lists all Stripe prices that are marked as per-employee pricing
 * by checking their metadata.
 * 
 * Usage:
 *   pnpm ts-node src/scripts/listStripePerEmployeePrices.ts
 * 
 * Requirements:
 *   - STRIPE_SECRET_KEY environment variable set in .env file
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { stripe, isStripeConfigured } from '../config/stripe';
import { STRIPE_PRODUCTS } from '../config/stripe';
import { logger } from '../lib/logger';

if (!isStripeConfigured() || !stripe) {
  void logger.error('STRIPE_SECRET_KEY environment variable is required', {
    operation: 'list_per_employee_prices_missing_secret',
  });
  void logger.info('Set STRIPE_SECRET_KEY in server/.env', {
    operation: 'list_per_employee_prices_missing_secret_help',
  });
  process.exit(1);
}

async function listPerEmployeePrices() {
  void logger.info('Listing all per-employee Stripe prices', {
    operation: 'list_per_employee_prices_start',
  });

  const keyPreview = process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'unknown';
  const isTest = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;
  void logger.info('Using Stripe key and environment', {
    operation: 'list_per_employee_prices_key_info',
    keyPreview,
    environment: isTest ? 'TEST' : 'LIVE',
  });

  // Map of product IDs to tier names
  const productIdToTier: Record<string, string> = {
    [STRIPE_PRODUCTS.PRO]: 'pro',
    [STRIPE_PRODUCTS.BUSINESS_BASIC]: 'business_basic',
    [STRIPE_PRODUCTS.BUSINESS_ADVANCED]: 'business_advanced',
    [STRIPE_PRODUCTS.ENTERPRISE]: 'enterprise',
  };

  let totalPerEmployeePrices = 0;
  let totalBasePrices = 0;

  // Get all products
  const products = Object.values(STRIPE_PRODUCTS);
  
  for (const productId of products) {
    const tier = productIdToTier[productId] || 'unknown';
    
    if (!stripe) {
      void logger.error('Stripe client not available', {
        operation: 'list_per_employee_prices_no_client',
      });
      continue;
    }
    
    try {
      // Get all prices for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 100,
      });

      if (prices.data.length === 0) {
        void logger.info('No Stripe prices found for tier', {
          operation: 'list_per_employee_prices_none_for_tier',
          tier,
          productId,
        });
        continue;
      }

      void logger.info('Found Stripe prices for tier', {
        operation: 'list_per_employee_prices_tier_found',
        tier,
        productId,
        count: prices.data.length,
      });
      
      // Separate base prices from per-employee prices
      const basePrices = prices.data.filter(
        (p) => !p.metadata?.type || p.metadata.type !== 'per_employee'
      );
      const perEmployeePrices = prices.data.filter(
        (p) => p.metadata?.type === 'per_employee'
      );

      // Display base prices
      if (basePrices.length > 0) {
        void logger.info('Base prices', {
          operation: 'list_per_employee_prices_base_header',
          tier,
          count: basePrices.length,
        });
        for (const price of basePrices) {
          const amount = (price.unit_amount || 0) / 100;
          const interval = price.recurring?.interval || 'one-time';
          const nickname = price.nickname || 'No nickname';
          void logger.info('Base price detail', {
            operation: 'list_per_employee_prices_base_detail',
            tier,
            nickname,
            priceId: price.id,
            amount,
            interval,
            createdDate: new Date(price.created * 1000).toLocaleDateString(),
          });
          totalBasePrices++;
        }
      }

      // Display per-employee prices
      if (perEmployeePrices.length > 0) {
        void logger.info('Per-employee prices', {
          operation: 'list_per_employee_prices_per_employee_header',
          tier,
          count: perEmployeePrices.length,
        });
        for (const price of perEmployeePrices) {
          const amount = (price.unit_amount || 0) / 100;
          const interval = price.recurring?.interval || 'one-time';
          const tierFromMeta = price.metadata?.tier || 'unknown';
          const billingCycle = price.metadata?.billingCycle || 'unknown';
          
          void logger.info('Per-employee price detail', {
            operation: 'list_per_employee_prices_per_employee_detail',
            tier,
            priceId: price.id,
            amount,
            interval,
            tierFromMeta,
            billingCycle,
            createdDate: new Date(price.created * 1000).toLocaleDateString(),
          });
          totalPerEmployeePrices++;
        }
      } else {
        void logger.warn('No per-employee prices found for tier', {
          operation: 'list_per_employee_prices_none_per_employee',
          tier,
          productId,
        });
      }
    } catch (error: unknown) {
      const err = error as Error;
      void logger.error('Error fetching Stripe prices for tier', {
        operation: 'list_per_employee_prices_fetch_error',
        tier,
        productId,
        error: { message: err.message, stack: err.stack },
      });
    }
  }

  void logger.info('Per-employee Stripe price listing summary', {
    operation: 'list_per_employee_prices_summary',
    totalBasePrices,
    totalPerEmployeePrices,
  });

  if (totalPerEmployeePrices === 0) {
    void logger.info(
      'Per-employee prices are created automatically when admin pricing is updated with per-employee values; identified by metadata.type=per_employee',
      { operation: 'list_per_employee_prices_tip' }
    );
  }
}

// Run if called directly
if (require.main === module) {
  listPerEmployeePrices()
    .then(() => {
      void logger.info('Done listing per-employee Stripe prices', {
        operation: 'list_per_employee_prices_done',
      });
      process.exit(0);
    })
    .catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Unexpected error while listing per-employee Stripe prices', {
        operation: 'list_per_employee_prices_unhandled',
        error: { message: err.message, stack: err.stack },
      });
      process.exit(1);
    });
}

export { listPerEmployeePrices };

