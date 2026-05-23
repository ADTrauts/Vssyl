-- Phase 5A: Ambient contextual assistance — suggestion model + lifecycle

-- Enums (before columns that reference them)
ALTER TYPE "AISuggestionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

CREATE TYPE "AISuggestionPriority" AS ENUM ('low', 'normal', 'high');

CREATE TYPE "AISuggestionFeedbackAction" AS ENUM ('accepted', 'dismissed', 'ignored');

-- Extend ai_suggestions
ALTER TABLE "ai_suggestions" ADD COLUMN "dashboardId" TEXT;
ALTER TABLE "ai_suggestions" ADD COLUMN "businessId" TEXT;
ALTER TABLE "ai_suggestions" ADD COLUMN "householdId" TEXT;
ALTER TABLE "ai_suggestions" ADD COLUMN "suggestionType" TEXT;
ALTER TABLE "ai_suggestions" ADD COLUMN "priority" "AISuggestionPriority" NOT NULL DEFAULT 'normal';
ALTER TABLE "ai_suggestions" ADD COLUMN "confidence" DOUBLE PRECISION;
ALTER TABLE "ai_suggestions" ADD COLUMN "explainability" JSONB;
ALTER TABLE "ai_suggestions" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "ai_suggestions" ADD COLUMN "shownAt" TIMESTAMP(3);
ALTER TABLE "ai_suggestions" ADD COLUMN "suppressionKey" TEXT;
ALTER TABLE "ai_suggestions" ADD COLUMN "correlationRuleId" TEXT;

-- Backfill suggestionType from legacy type column
UPDATE "ai_suggestions" SET "suggestionType" = "type" WHERE "suggestionType" IS NULL;

CREATE INDEX "ai_suggestions_userId_dashboardId_status_createdAt_idx"
  ON "ai_suggestions"("userId", "dashboardId", "status", "createdAt");
CREATE INDEX "ai_suggestions_userId_suppressionKey_idx"
  ON "ai_suggestions"("userId", "suppressionKey");
CREATE INDEX "ai_suggestions_expiresAt_idx" ON "ai_suggestions"("expiresAt");

CREATE TABLE "ai_suggestion_signals" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dashboardId" TEXT,
  "businessId" TEXT,
  "domainEventId" TEXT,
  "domainEventType" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "sourceModule" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "processedAt" TIMESTAMP(3),
  "ruleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

  CONSTRAINT "ai_suggestion_signals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_suggestion_signals_userId_dashboardId_occurredAt_idx"
  ON "ai_suggestion_signals"("userId", "dashboardId", "occurredAt");
CREATE INDEX "ai_suggestion_signals_domainEventId_idx"
  ON "ai_suggestion_signals"("domainEventId");

ALTER TABLE "ai_suggestion_signals"
  ADD CONSTRAINT "ai_suggestion_signals_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_suggestion_feedback" (
  "id" TEXT NOT NULL,
  "suggestionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" "AISuggestionFeedbackAction" NOT NULL,
  "reason" TEXT,
  "doNotShowAgain" BOOLEAN NOT NULL DEFAULT false,
  "suppressionKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_suggestion_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_suggestion_feedback_suggestionId_idx"
  ON "ai_suggestion_feedback"("suggestionId");
CREATE INDEX "ai_suggestion_feedback_userId_suppressionKey_idx"
  ON "ai_suggestion_feedback"("userId", "suppressionKey");

ALTER TABLE "ai_suggestion_feedback"
  ADD CONSTRAINT "ai_suggestion_feedback_suggestionId_fkey"
  FOREIGN KEY ("suggestionId") REFERENCES "ai_suggestions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_suggestion_feedback"
  ADD CONSTRAINT "ai_suggestion_feedback_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
