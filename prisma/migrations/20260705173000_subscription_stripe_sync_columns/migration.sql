-- Production drift fix: subscriptions table missing Stripe sync columns from baseline.
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripeMetadata" JSONB;
