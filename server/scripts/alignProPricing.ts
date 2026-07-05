/**
 * Align Pro tier PricingConfig basePrice with Stripe canonical prices.
 * Run before `pnpm stripe:sync` when DB and Stripe amounts drift.
 *
 * Usage:
 *   DATABASE_URL=... pnpm exec ts-node scripts/alignProPricing.ts
 */
import { prisma } from '../src/lib/prisma';
import { alignProPricingInDatabase } from '../src/services/pricingStripeSyncService';

async function alignProPricing(): Promise<void> {
  const result = await alignProPricingInDatabase();
  console.log(`Pro pricing aligned: monthly rows=${result.monthly}, yearly rows=${result.yearly}`);
  console.log('Canonical: $49.99/mo, $499.99/yr');
}

if (require.main === module) {
  alignProPricing()
    .catch((error: unknown) => {
      console.error('Failed to align Pro pricing:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { alignProPricing };
