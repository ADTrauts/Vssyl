-- Phase 4: AI Operations Center workflow fields (additive; no redesign of execution hub)

ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "workflowStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "assignedToUserId" TEXT;
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "priority" TEXT;
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "severity" TEXT;
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION;
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "commentsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ai_evaluations_workflowStatus_idx" ON "ai_evaluations"("workflowStatus");
CREATE INDEX IF NOT EXISTS "ai_evaluations_assignedToUserId_idx" ON "ai_evaluations"("assignedToUserId");

ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NOT NULL DEFAULT 'SUGGESTED';
ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "reviewedByUserId" TEXT;
ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "historyJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ai_root_cause_findings_reviewStatus_idx" ON "ai_root_cause_findings"("reviewStatus");

ALTER TABLE "ai_correction_routes" ADD COLUMN IF NOT EXISTS "assignedOwnerId" TEXT;
ALTER TABLE "ai_correction_routes" ADD COLUMN IF NOT EXISTS "overrideDestinationsJson" JSONB;
ALTER TABLE "ai_correction_routes" ADD COLUMN IF NOT EXISTS "routingApprovalStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW';
ALTER TABLE "ai_correction_routes" ADD COLUMN IF NOT EXISTS "commentsJson" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "ai_correction_routes_routingApprovalStatus_idx" ON "ai_correction_routes"("routingApprovalStatus");
CREATE INDEX IF NOT EXISTS "ai_correction_routes_assignedOwnerId_idx" ON "ai_correction_routes"("assignedOwnerId");

ALTER TABLE "ai_regression_cases" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;
ALTER TABLE "ai_regression_cases" ADD COLUMN IF NOT EXISTS "priority" TEXT;
ALTER TABLE "ai_regression_cases" ADD COLUMN IF NOT EXISTS "historyJson" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "ai_regression_cases_ownerUserId_idx" ON "ai_regression_cases"("ownerUserId");
