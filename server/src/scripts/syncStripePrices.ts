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
import { syncStripePriceIdsToDatabase } from '../services/pricingStripeSyncService';

async function syncStripePrices() {
  if (!isStripeConfigured() || !stripe) {
    void logger.error('Stripe is not configured', { operation: 'sync_stripe_prices_not_configured' });
    void logger.info('Set STRIPE_SECRET_KEY environment variable', { operation: 'sync_stripe_prices_not_configured_help' });
    process.exit(1);
  }

  void logger.info('Syncing Stripe prices to database', { operation: 'sync_stripe_prices_start' });
  const result = await syncStripePriceIdsToDatabase();

  void logger.info('Stripe price sync summary', {
    operation: 'sync_stripe_prices_summary',
    synced: result.synced,
    skipped: result.skipped,
    errors: result.errors,
    alignedPro: result.alignedPro,
  });

  if (result.synced > 0) {
    void logger.info('Stripe price sync completed successfully', {
      operation: 'sync_stripe_prices_done_success',
      synced: result.synced,
    });
  } else if (result.errors === 0) {
    void logger.info('All Stripe prices already synced or skipped', {
      operation: 'sync_stripe_prices_done_no_changes',
    });
  } else {
    void logger.warn('Stripe price sync completed with errors', {
      operation: 'sync_stripe_prices_done_with_errors',
      errors: result.errors,
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

