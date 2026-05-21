-- Dynamic AI pipeline registry metadata (R1)

ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "priority" INTEGER;
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "defaultRequiredTools" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "capabilities" JSONB;
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ai_pipeline_intent_policies" ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "requiredTools" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "minimumConfidence" TEXT;
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "enforcementBehavior" TEXT;
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ai_pipeline_grounding_rule_policies" ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "lifecycleStatus" TEXT;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "retrievalPriority" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "supportedIntents" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "permissionsRequired" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "sensitivityLevel" TEXT;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "mappedTools" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "capabilities" JSONB;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ai_pipeline_context_source_policies" ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "riskLevel" TEXT;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "requiresGrounding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "rateLimitPerMinute" INTEGER;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "runtimeKind" TEXT;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "capabilities" JSONB;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ai_pipeline_tool_policy_rows" ADD COLUMN IF NOT EXISTS "createdByAdminId" TEXT;

UPDATE "ai_pipeline_intent_policies" SET "isSystem" = true WHERE "isSystem" = false;
UPDATE "ai_pipeline_grounding_rule_policies" SET "isSystem" = true WHERE "isSystem" = false;
UPDATE "ai_pipeline_context_source_policies" SET "isSystem" = true WHERE "isSystem" = false;
UPDATE "ai_pipeline_tool_policy_rows" SET "isSystem" = true WHERE "isSystem" = false;

CREATE INDEX IF NOT EXISTS "ai_pipeline_intent_policies_archived_idx" ON "ai_pipeline_intent_policies"("archived");
CREATE INDEX IF NOT EXISTS "ai_pipeline_intent_policies_enabled_idx" ON "ai_pipeline_intent_policies"("enabled");
CREATE INDEX IF NOT EXISTS "ai_pipeline_grounding_rule_policies_archived_idx" ON "ai_pipeline_grounding_rule_policies"("archived");
CREATE INDEX IF NOT EXISTS "ai_pipeline_context_source_policies_archived_idx" ON "ai_pipeline_context_source_policies"("archived");
CREATE INDEX IF NOT EXISTS "ai_pipeline_tool_policy_rows_archived_idx" ON "ai_pipeline_tool_policy_rows"("archived");
