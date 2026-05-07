/**
 * Setup Stripe Products and Prices for AI Query Packs
 * 
 * This script creates Stripe products and prices for AI query packs
 * (one-time payment products, not subscriptions)
 * 
 * Usage:
 *   pnpm stripe:setup-query-packs
 * 
 * Requirements:
 *   - STRIPE_SECRET_KEY environment variable set in .env file
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Stripe from 'stripe';
import { isStripeConfigured, STRIPE_PRODUCTS } from '../config/stripe';
import { AI_QUERY_PACKS } from '../config/aiQueryPacks';
import { logger } from '../lib/logger';

if (!isStripeConfigured() || !process.env.STRIPE_SECRET_KEY) {
  void logger.error('STRIPE_SECRET_KEY environment variable is required', {
    operation: 'setup_query_pack_products_missing_secret',
  });
  void logger.info('Set STRIPE_SECRET_KEY in server/.env', {
    operation: 'setup_query_pack_products_missing_secret_help',
  });
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil' as any, // TypeScript types may lag behind Stripe API versions
});

void logger.info('Setting up Stripe products for AI query packs', {
  operation: 'setup_query_pack_products_start',
});

const keyPreview = process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'unknown';
const isTest = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;
void logger.info('Using Stripe key and environment', {
  operation: 'setup_query_pack_products_key_info',
  keyPreview,
  environment: isTest ? 'TEST' : 'LIVE',
});

async function setupQueryPackProducts() {
  try {
    // Create product for AI Query Packs
    const productId = STRIPE_PRODUCTS.AI_QUERY_PACKS;
    
    void logger.info('Creating AI query packs product', {
      operation: 'setup_query_pack_products_create_product',
      productId,
    });
    
    let product;
    try {
      product = await stripe.products.create({
        id: productId,
        name: 'AI Query Packs',
        description: 'One-time purchase of additional AI queries that never expire',
        type: 'service',
      });
      void logger.info('AI query packs product created', {
        operation: 'setup_query_pack_products_create_product_success',
        productId: product.id,
      });
    } catch (error: unknown) {
      const err = error as Stripe.errors.StripeError;
      if (err.code === 'resource_already_exists') {
        void logger.warn('AI query packs product already exists; using existing product', {
          operation: 'setup_query_pack_products_product_exists',
          productId,
        });
        product = await stripe.products.retrieve(productId);
      } else {
        throw error;
      }
    }

    // Create prices for each query pack
    const packTypes = Object.keys(AI_QUERY_PACKS) as Array<keyof typeof AI_QUERY_PACKS>;
    
    for (const packType of packTypes) {
      const pack = AI_QUERY_PACKS[packType];
      void logger.debug('Creating price for AI query pack', {
        operation: 'setup_query_pack_products_create_price',
        packType,
        packName: pack.name,
      });

      try {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(pack.price * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            packType,
            queries: pack.queries.toString(),
            type: 'ai_query_pack',
          },
          nickname: `${pack.name} - ${pack.queries.toLocaleString()} queries`,
        });

        void logger.info('AI query pack price created', {
          operation: 'setup_query_pack_products_create_price_success',
          packType,
          packName: pack.name,
          priceId: price.id,
          amount: pack.price,
          queries: pack.queries,
        });
      } catch (error: unknown) {
        const err = error as Stripe.errors.StripeError;
        if (err.code === 'resource_already_exists') {
          void logger.warn('AI query pack price already exists; skipping', {
            operation: 'setup_query_pack_products_price_exists',
            packType,
            packName: pack.name,
          });
        } else {
          void logger.error('Error creating AI query pack price', {
            operation: 'setup_query_pack_products_create_price_error',
            packType,
            packName: pack.name,
            error: { message: err.message },
          });
        }
      }
    }

    void logger.info('AI query pack products and prices setup complete', {
      operation: 'setup_query_pack_products_complete',
      productId: product.id,
      productName: product.name,
      packsCount: packTypes.length,
    });
    packTypes.forEach(packType => {
      const pack = AI_QUERY_PACKS[packType];
      void logger.info('AI query pack summary', {
        operation: 'setup_query_pack_products_summary',
        packType,
        packName: pack.name,
        amount: pack.price,
        queries: pack.queries,
      });
    });
    void logger.info(
      'Next steps: sync query pack price IDs, update code to use Stripe IDs, and test purchase flow',
      { operation: 'setup_query_pack_products_next_steps' }
    );
  } catch (error: unknown) {
    const err = error as Error;
    void logger.error('AI query pack setup failed', {
      operation: 'setup_query_pack_products_failed',
      error: { message: err.message, stack: err.stack },
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupQueryPackProducts()
    .catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Unexpected error in setupQueryPackProducts', {
        operation: 'setup_query_pack_products_unhandled',
        error: { message: err.message, stack: err.stack },
      });
      process.exit(1);
    });
}

export { setupQueryPackProducts };

