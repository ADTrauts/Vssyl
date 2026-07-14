-- Phase 5: Runtime observation event log on AIExecutionRecord (additive)
ALTER TABLE "ai_execution_records" ADD COLUMN IF NOT EXISTS "observationEventsJson" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "ai_execution_records_requestId_idx" ON "ai_execution_records"("requestId");
