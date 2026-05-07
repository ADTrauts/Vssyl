/**
 * Sync Stripe Price IDs for AI Query Packs to environment variables
 * 
 * This script:
 * 1. Fetches all Stripe prices for the AI Query Packs product
 * 2. Matches them to query pack types by metadata
 * 3. Outputs the price IDs for you to add to .env file
 * 
 * Usage:
 *   pnpm stripe:sync-query-pack-prices
 * 
 * Requirements:
 *   - STRIPE_SECRET_KEY environment variable set in .env file
 *   - Query pack products/prices already created (run stripe:setup-query-packs first)
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { isStripeConfigured, STRIPE_PRODUCTS } from '../config/stripe';
import { AI_QUERY_PACKS } from '../config/aiQueryPacks';
import Stripe from 'stripe';
import { logger } from '../lib/logger';

if (!isStripeConfigured() || !process.env.STRIPE_SECRET_KEY) {
  void logger.error('STRIPE_SECRET_KEY environment variable is required', {
    operation: 'sync_query_pack_prices_missing_secret',
  });
  void logger.info('Set STRIPE_SECRET_KEY in server/.env', {
    operation: 'sync_query_pack_prices_missing_secret_help',
  });
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil' as any,
});

async function syncQueryPackPrices() {
  void logger.info('Syncing Stripe price IDs for AI query packs', {
    operation: 'sync_query_pack_prices_start',
  });

  const keyPreview = process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'unknown';
  const isTest = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;
  void logger.info('Using Stripe key and environment', {
    operation: 'sync_query_pack_prices_key_info',
    keyPreview,
    environment: isTest ? 'TEST' : 'LIVE',
  });

  try {
    const productId = STRIPE_PRODUCTS.AI_QUERY_PACKS;

    // Get all prices for the AI Query Packs product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100,
    });

    if (prices.data.length === 0) {
      void logger.warn('No prices found for AI query packs product', {
        operation: 'sync_query_pack_prices_none_found',
      });
      void logger.info('Run pnpm stripe:setup-query-packs first', {
        operation: 'sync_query_pack_prices_none_found_help',
      });
      return;
    }

    void logger.info('Found Stripe prices for AI query packs', {
      operation: 'sync_query_pack_prices_found',
      count: prices.data.length,
    });

    // Match prices to pack types by metadata
    const packTypes = Object.keys(AI_QUERY_PACKS) as Array<keyof typeof AI_QUERY_PACKS>;
    const priceMap: Record<string, string> = {};

    for (const packType of packTypes) {
      const pack = AI_QUERY_PACKS[packType];
      
      // Find matching price by metadata.packType
      const matchingPrice = prices.data.find(
        (p) => p.metadata?.packType === packType
      );

      if (matchingPrice) {
        priceMap[packType] = matchingPrice.id;
        void logger.info('Matched query pack Stripe price', {
          operation: 'sync_query_pack_prices_match',
          packType,
          packName: pack.name,
          priceId: matchingPrice.id,
          amount: (matchingPrice.unit_amount || 0) / 100,
          queries: pack.queries,
        });
      } else {
        void logger.warn('No Stripe price found for query pack', {
          operation: 'sync_query_pack_prices_missing_pack',
          packType,
          packName: pack.name,
        });
      }
    }

    // Output environment variables to add to .env
    void logger.info('Add these values to server/.env', {
      operation: 'sync_query_pack_prices_env_instructions',
    });
    for (const [packType, priceId] of Object.entries(priceMap)) {
      const envVarName = `STRIPE_QUERY_PACK_${packType.toUpperCase()}_PRICE_ID`;
      void logger.info(`${envVarName}=${priceId}`, {
        operation: 'sync_query_pack_prices_env_value',
        packType,
        priceId,
      });
    }
    void logger.info('Query pack Stripe price IDs synced', {
      operation: 'sync_query_pack_prices_done',
      count: Object.keys(priceMap).length,
    });
    void logger.info('After adding to .env, restart server for changes to take effect', {
      operation: 'sync_query_pack_prices_done_help',
    });

  } catch (error: unknown) {
    const err = error as Error;
    void logger.error('Error syncing query pack price IDs', {
      operation: 'sync_query_pack_prices_error',
      error: { message: err.message, stack: err.stack },
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncQueryPackPrices()
    .then(() => {
      void logger.info('Done syncing query pack price IDs', {
        operation: 'sync_query_pack_prices_done_exit',
      });
      process.exit(0);
    })
    .catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Unexpected error syncing query pack price IDs', {
        operation: 'sync_query_pack_prices_unhandled',
        error: { message: err.message, stack: err.stack },
      });
      process.exit(1);
    });
}

export { syncQueryPackPrices };

