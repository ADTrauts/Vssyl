/**
 * One-shot Stripe price sync for Cloud Run Job or operator CLI against production DB.
 * Usage (in container): node server/dist/cli/runStripePriceSync.js
 */
import { syncStripePriceIdsToDatabase } from '../services/pricingStripeSyncService.js';

syncStripePriceIdsToDatabase()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(err.message);
    process.exit(1);
  });
