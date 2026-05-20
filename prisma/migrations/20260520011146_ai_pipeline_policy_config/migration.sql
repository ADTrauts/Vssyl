-- CreateTable
CREATE TABLE "ai_pipeline_intent_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggerExamples" TEXT[],
    "groundingRequired" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ai_pipeline_intent_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_pipeline_grounding_rule_policies" (
    "intentId" TEXT NOT NULL,
    "requiredSources" TEXT[],
    "optionalSources" TEXT[],
    "requirementSummary" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ai_pipeline_grounding_rule_policies_pkey" PRIMARY KEY ("intentId")
);

-- CreateTable
CREATE TABLE "ai_pipeline_context_source_policies" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "wiredInTwin" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ai_pipeline_context_source_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_pipeline_tool_policy_rows" (
    "toolId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "requiredIntents" TEXT[],
    "optionalIntents" TEXT[],
    "requiredPermissions" TEXT[],
    "fallbackBehavior" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ai_pipeline_tool_policy_rows_pkey" PRIMARY KEY ("toolId")
);

-- CreateTable
CREATE TABLE "ai_pipeline_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "weakGenericPhrases" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ai_pipeline_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_pipeline_policy_audit_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_pipeline_policy_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_pipeline_policy_audit_logs_adminUserId_idx" ON "ai_pipeline_policy_audit_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "ai_pipeline_policy_audit_logs_entityType_idx" ON "ai_pipeline_policy_audit_logs"("entityType");

-- CreateIndex
CREATE INDEX "ai_pipeline_policy_audit_logs_entityId_idx" ON "ai_pipeline_policy_audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "ai_pipeline_policy_audit_logs_createdAt_idx" ON "ai_pipeline_policy_audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "ai_pipeline_policy_audit_logs" ADD CONSTRAINT "ai_pipeline_policy_audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
