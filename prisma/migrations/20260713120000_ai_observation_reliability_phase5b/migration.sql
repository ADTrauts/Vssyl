-- Phase 5B: Immutable observation events + hub state/version
ALTER TABLE "ai_execution_records" ADD COLUMN IF NOT EXISTS "observationState" TEXT NOT NULL DEFAULT 'STARTED';
ALTER TABLE "ai_execution_records" ADD COLUMN IF NOT EXISTS "observationVersion" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "ai_execution_records_observationState_idx" ON "ai_execution_records"("observationState");

CREATE TABLE IF NOT EXISTS "ai_observation_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "executionRecordId" TEXT,
    "requestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 2,
    "sequenceNumber" INTEGER NOT NULL,
    "emittedAt" TIMESTAMP(3) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surface" TEXT NOT NULL,
    "sourceComponent" TEXT,
    "conversationId" TEXT,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "deliveryClass" TEXT NOT NULL DEFAULT 'ASYNC_AT_LEAST_ONCE',
    "retentionClass" TEXT NOT NULL DEFAULT 'HOT',
    "correlationJson" JSONB NOT NULL DEFAULT '{}',
    "metadataJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_observation_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_observation_events_eventId_key" ON "ai_observation_events"("eventId");
CREATE INDEX IF NOT EXISTS "ai_observation_events_executionRecordId_sequenceNumber_idx" ON "ai_observation_events"("executionRecordId", "sequenceNumber");
CREATE INDEX IF NOT EXISTS "ai_observation_events_requestId_sequenceNumber_idx" ON "ai_observation_events"("requestId", "sequenceNumber");
CREATE INDEX IF NOT EXISTS "ai_observation_events_eventType_idx" ON "ai_observation_events"("eventType");
CREATE INDEX IF NOT EXISTS "ai_observation_events_emittedAt_idx" ON "ai_observation_events"("emittedAt");
CREATE INDEX IF NOT EXISTS "ai_observation_events_retentionClass_createdAt_idx" ON "ai_observation_events"("retentionClass", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_observation_events_userId_createdAt_idx" ON "ai_observation_events"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ai_observation_events"
    ADD CONSTRAINT "ai_observation_events_executionRecordId_fkey"
    FOREIGN KEY ("executionRecordId") REFERENCES "ai_execution_records"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
