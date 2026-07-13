-- Phase 3: AI Intelligence Platform observational hub
-- Links existing history/diagnostics/action executions; does not replace AIActionExecution.

CREATE TABLE IF NOT EXISTS "ai_execution_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "surface" TEXT NOT NULL,
    "conversationHistoryId" TEXT,
    "pipelineDiagnosticId" TEXT,
    "conversationId" TEXT,
    "requestId" TEXT,
    "userQuery" TEXT,
    "aiResponseSummary" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "routingSummaryJson" JSONB,
    "linkedArtifactsJson" JSONB NOT NULL DEFAULT '{}',
    "timelineJson" JSONB NOT NULL DEFAULT '[]',
    "usageJson" JSONB,
    "errorSummary" TEXT,
    "diagnosticsSummaryJson" JSONB,
    "learningSignalsJson" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_execution_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_execution_records_userId_idx" ON "ai_execution_records"("userId");
CREATE INDEX IF NOT EXISTS "ai_execution_records_businessId_idx" ON "ai_execution_records"("businessId");
CREATE INDEX IF NOT EXISTS "ai_execution_records_surface_idx" ON "ai_execution_records"("surface");
CREATE INDEX IF NOT EXISTS "ai_execution_records_conversationHistoryId_idx" ON "ai_execution_records"("conversationHistoryId");
CREATE INDEX IF NOT EXISTS "ai_execution_records_pipelineDiagnosticId_idx" ON "ai_execution_records"("pipelineDiagnosticId");
CREATE INDEX IF NOT EXISTS "ai_execution_records_conversationId_idx" ON "ai_execution_records"("conversationId");
CREATE INDEX IF NOT EXISTS "ai_execution_records_createdAt_idx" ON "ai_execution_records"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ai_execution_records" ADD CONSTRAINT "ai_execution_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ai_evaluations" (
    "id" TEXT NOT NULL,
    "executionRecordId" TEXT NOT NULL,
    "evaluatorRole" TEXT NOT NULL,
    "evaluatorUserId" TEXT,
    "labelsJson" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "mutatesRuntime" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_evaluations_executionRecordId_idx" ON "ai_evaluations"("executionRecordId");
CREATE INDEX IF NOT EXISTS "ai_evaluations_evaluatorRole_idx" ON "ai_evaluations"("evaluatorRole");
CREATE INDEX IF NOT EXISTS "ai_evaluations_createdAt_idx" ON "ai_evaluations"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_executionRecordId_fkey" FOREIGN KEY ("executionRecordId") REFERENCES "ai_execution_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ai_root_cause_findings" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_root_cause_findings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_root_cause_findings_evaluationId_idx" ON "ai_root_cause_findings"("evaluationId");
CREATE INDEX IF NOT EXISTS "ai_root_cause_findings_code_idx" ON "ai_root_cause_findings"("code");

DO $$ BEGIN
  ALTER TABLE "ai_root_cause_findings" ADD CONSTRAINT "ai_root_cause_findings_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ai_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ai_correction_routes" (
    "id" TEXT NOT NULL,
    "executionRecordId" TEXT NOT NULL,
    "evaluationId" TEXT,
    "rootCauseCode" TEXT NOT NULL,
    "destinationsJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "rationale" TEXT,
    "ownerHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ai_correction_routes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_correction_routes_executionRecordId_idx" ON "ai_correction_routes"("executionRecordId");
CREATE INDEX IF NOT EXISTS "ai_correction_routes_evaluationId_idx" ON "ai_correction_routes"("evaluationId");
CREATE INDEX IF NOT EXISTS "ai_correction_routes_rootCauseCode_idx" ON "ai_correction_routes"("rootCauseCode");
CREATE INDEX IF NOT EXISTS "ai_correction_routes_status_idx" ON "ai_correction_routes"("status");

DO $$ BEGIN
  ALTER TABLE "ai_correction_routes" ADD CONSTRAINT "ai_correction_routes_executionRecordId_fkey" FOREIGN KEY ("executionRecordId") REFERENCES "ai_execution_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ai_correction_routes" ADD CONSTRAINT "ai_correction_routes_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ai_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ai_regression_cases" (
    "id" TEXT NOT NULL,
    "executionRecordId" TEXT NOT NULL,
    "evaluationId" TEXT,
    "correctionRouteId" TEXT,
    "title" TEXT NOT NULL,
    "originalRequest" TEXT NOT NULL,
    "expectationsJson" JSONB NOT NULL,
    "tagsJson" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastResultNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_regression_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_regression_cases_executionRecordId_idx" ON "ai_regression_cases"("executionRecordId");
CREATE INDEX IF NOT EXISTS "ai_regression_cases_status_idx" ON "ai_regression_cases"("status");
CREATE INDEX IF NOT EXISTS "ai_regression_cases_createdAt_idx" ON "ai_regression_cases"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ai_regression_cases" ADD CONSTRAINT "ai_regression_cases_executionRecordId_fkey" FOREIGN KEY ("executionRecordId") REFERENCES "ai_execution_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ai_regression_cases" ADD CONSTRAINT "ai_regression_cases_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ai_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ai_regression_cases" ADD CONSTRAINT "ai_regression_cases_correctionRouteId_fkey" FOREIGN KEY ("correctionRouteId") REFERENCES "ai_correction_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
