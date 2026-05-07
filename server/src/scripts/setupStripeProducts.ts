/**
 * Stripe Products Setup Script for Vssyl
 * 
 * This script creates all the necessary products and prices in your Stripe account
 * to match the configuration in your Vssyl codebase.
 * 
 * Usage:
 *   pnpm stripe:setup
 * 
 * Requirements:
 *   - STRIPE_SECRET_KEY environment variable set in .env file
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Stripe from 'stripe';
import { isStripeConfigured } from '../config/stripe';
import { logger } from '../lib/logger';

if (!isStripeConfigured() || !process.env.STRIPE_SECRET_KEY) {
  void logger.error('STRIPE_SECRET_KEY environment variable is required', {
    operation: 'setup_stripe_products_missing_secret',
  });
  void logger.info('Set STRIPE_SECRET_KEY in server/.env', {
    operation: 'setup_stripe_products_missing_secret_help',
  });
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil' as any, // TypeScript types may lag behind Stripe API versions
});

void logger.info('Setting up Stripe products for Vssyl', { operation: 'setup_stripe_products_start' });

// Product and price configurations matching your new simplified structure
const PRODUCTS_CONFIG = [
  {
    id: 'prod_pro',
    name: 'Vssyl Pro Plan',
    description: 'Full platform access with unlimited AI features',
    prices: [
      {
        id: 'price_pro_monthly',
        amount: 2900, // $29.00 in cents
        currency: 'usd',
        interval: 'month' as const,
        nickname: 'Pro Monthly',
      },
      {
        id: 'price_pro_yearly',
        amount: 29000, // $290.00 in cents
        currency: 'usd',
        interval: 'year' as const,
        nickname: 'Pro Yearly',
      },
    ],
  },
  {
    id: 'prod_business_basic',
    name: 'Vssyl Business Basic',
    description: 'Team workspace with basic AI settings and 10 included employees',
    prices: [
      {
        id: 'price_business_basic_monthly',
        amount: 4999, // $49.99 in cents
        currency: 'usd',
        interval: 'month' as const,
        nickname: 'Business Basic Monthly',
      },
      {
        id: 'price_business_basic_yearly',
        amount: 49999, // $499.99 in cents
        currency: 'usd',
        interval: 'year' as const,
        nickname: 'Business Basic Yearly',
      },
    ],
  },
  {
    id: 'prod_business_advanced',
    name: 'Vssyl Business Advanced',
    description: 'Team workspace with advanced AI settings and 10 included employees',
    prices: [
      {
        id: 'price_business_advanced_monthly',
        amount: 6999, // $69.99 in cents
        currency: 'usd',
        interval: 'month' as const,
        nickname: 'Business Advanced Monthly',
      },
      {
        id: 'price_business_advanced_yearly',
        amount: 69999, // $699.99 in cents
        currency: 'usd',
        interval: 'year' as const,
        nickname: 'Business Advanced Yearly',
      },
    ],
  },
  {
    id: 'prod_enterprise',
    name: 'Vssyl Enterprise Plan',
    description: 'Enterprise workspace with unlimited AI, custom integrations, and dedicated support',
    prices: [
      {
        id: 'price_enterprise_monthly',
        amount: 12999, // $129.99 in cents
        currency: 'usd',
        interval: 'month' as const,
        nickname: 'Enterprise Monthly',
      },
      {
        id: 'price_enterprise_yearly',
        amount: 129999, // $1299.99 in cents
        currency: 'usd',
        interval: 'year' as const,
        nickname: 'Enterprise Yearly',
      },
    ],
  },
];

interface ProductConfig {
  id: string;
  name: string;
  description: string;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    nickname: string;
  }>;
}

async function createProduct(productConfig: ProductConfig) {
  try {
    void logger.info('Creating Stripe product', {
      operation: 'setup_stripe_products_create_product',
      productId: productConfig.id,
      productName: productConfig.name,
    });

    // Create the product
    const product = await stripe.products.create({
      id: productConfig.id,
      name: productConfig.name,
      description: productConfig.description,
      type: 'service',
    });

    void logger.info('Stripe product created', {
      operation: 'setup_stripe_products_create_product_success',
      productId: product.id,
    });

    // Create prices for this product
    for (const priceConfig of productConfig.prices) {
      void logger.debug('Creating Stripe price', {
        operation: 'setup_stripe_products_create_price',
        productId: product.id,
        nickname: priceConfig.nickname,
      });

      // Note: Stripe doesn't allow custom IDs for prices, only products
      // We'll create the price and then sync the ID to database
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        recurring: {
          interval: priceConfig.interval,
        },
        nickname: priceConfig.nickname,
      });

      void logger.info('Stripe price created', {
        operation: 'setup_stripe_products_create_price_success',
        priceId: price.id,
        amount: priceConfig.amount / 100,
        interval: priceConfig.interval,
      });
    }

    return product;
  } catch (error: unknown) {
    const err = error as Stripe.errors.StripeError;
    if (err.code === 'resource_already_exists') {
      void logger.warn('Stripe product already exists; continuing with prices', {
        operation: 'setup_stripe_products_product_exists',
        productId: productConfig.id,
      });

      // Still try to create prices if product exists
      for (const priceConfig of productConfig.prices) {
        try {
          void logger.debug('Creating Stripe price for existing product', {
            operation: 'setup_stripe_products_create_price_existing_product',
            productId: productConfig.id,
            nickname: priceConfig.nickname,
          });

          // Note: Stripe doesn't allow custom IDs for prices, only products
          // We'll create the price and then sync the ID to database
          const price = await stripe.prices.create({
            product: productConfig.id,
            unit_amount: priceConfig.amount,
            currency: priceConfig.currency,
            recurring: {
              interval: priceConfig.interval,
            },
            nickname: priceConfig.nickname,
          });

          void logger.info('Stripe price created for existing product', {
            operation: 'setup_stripe_products_create_price_existing_product_success',
            priceId: price.id,
            amount: priceConfig.amount / 100,
            interval: priceConfig.interval,
          });
        } catch (priceError: unknown) {
          const priceErr = priceError as Stripe.errors.StripeError;
          if (priceErr.code === 'resource_already_exists') {
            void logger.warn('Stripe price already exists; skipping', {
              operation: 'setup_stripe_products_price_exists',
              priceConfigId: priceConfig.id,
            });
          } else {
            void logger.error('Error creating Stripe price', {
              operation: 'setup_stripe_products_create_price_error',
              priceConfigId: priceConfig.id,
              error: { message: priceErr.message },
            });
          }
        }
      }
    } else {
      void logger.error('Error creating Stripe product', {
        operation: 'setup_stripe_products_create_product_error',
        productId: productConfig.id,
        error: { message: err.message },
      });
      throw error;
    }
  }
}

async function setupStripeProducts() {
  try {
    const keyPreview = process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'unknown';
    const isTest = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false;
    void logger.info('Using Stripe key and environment', {
      operation: 'setup_stripe_products_key_info',
      keyPreview,
      environment: isTest ? 'TEST' : 'LIVE',
    });

    // Create all products and prices
    for (const productConfig of PRODUCTS_CONFIG) {
      await createProduct(productConfig);
    }

    void logger.info('All Stripe products and prices created successfully', {
      operation: 'setup_stripe_products_success',
    });
    PRODUCTS_CONFIG.forEach((product) => {
      void logger.info('Product summary', {
        operation: 'setup_stripe_products_summary_product',
        productName: product.name,
        productId: product.id,
      });
      product.prices.forEach((price) => {
        void logger.info('Price summary', {
          operation: 'setup_stripe_products_summary_price',
          nickname: price.nickname,
          amount: price.amount / 100,
          interval: price.interval,
        });
      });
    });

    void logger.info(
      'Next steps: run stripe:sync, stripe:verify, and test subscription creation',
      { operation: 'setup_stripe_products_next_steps' }
    );
  } catch (error: unknown) {
    const err = error as Error;
    void logger.error('Stripe product setup failed', {
      operation: 'setup_stripe_products_failed',
      error: { message: err.message, stack: err.stack },
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupStripeProducts()
    .catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      void logger.error('Unexpected error in setupStripeProducts', {
        operation: 'setup_stripe_products_unhandled',
        error: { message: err.message, stack: err.stack },
      });
      process.exit(1);
    });
}

export { setupStripeProducts };

