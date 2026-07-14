-- Phase 6: Evaluation & Correction Workflow — extend existing intelligence models
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "resolutionCode" TEXT;
ALTER TABLE "ai_evaluations" ADD COLUMN IF NOT EXISTS "historyJson" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION;
ALTER TABLE "ai_root_cause_findings" ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

ALTER TABLE "ai_correction_routes" ADD COLUMN IF NOT EXISTS "historyJson" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS "ai_correction_work_items" (
    "id" TEXT NOT NULL,
    "correctionRouteId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "assignedOwnerId" TEXT,
    "historyJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_correction_work_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_correction_work_items_correctionRouteId_idx" ON "ai_correction_work_items"("correctionRouteId");
CREATE INDEX IF NOT EXISTS "ai_correction_work_items_status_idx" ON "ai_correction_work_items"("status");
CREATE INDEX IF NOT EXISTS "ai_correction_work_items_kind_idx" ON "ai_correction_work_items"("kind");
CREATE INDEX IF NOT EXISTS "ai_correction_work_items_assignedOwnerId_idx" ON "ai_correction_work_items"("assignedOwnerId");

DO $$ BEGIN
  ALTER TABLE "ai_correction_work_items"
    ADD CONSTRAINT "ai_correction_work_items_correctionRouteId_fkey"
    FOREIGN KEY ("correctionRouteId") REFERENCES "ai_correction_routes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
