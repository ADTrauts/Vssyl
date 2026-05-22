-- Phase 3B: per-provider module context cache (keyed by provider + scope)
ALTER TABLE "module_installations" ADD COLUMN IF NOT EXISTS "contextProviderCache" JSONB;
