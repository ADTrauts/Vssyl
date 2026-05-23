-- Phase 5A enum alignment (idempotent).
-- Enums and columns are created in 20260522120000_ai_suggestion_ambient_fields.
-- This migration only converts legacy TEXT columns if an older 5A draft was applied.

ALTER TYPE "AISuggestionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

DO $$ BEGIN
  CREATE TYPE "AISuggestionPriority" AS ENUM ('low', 'normal', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_suggestions'
      AND column_name = 'priority'
      AND udt_name <> 'AISuggestionPriority'
  ) THEN
    ALTER TABLE "ai_suggestions" ALTER COLUMN "priority" DROP DEFAULT;
    ALTER TABLE "ai_suggestions"
      ALTER COLUMN "priority" TYPE "AISuggestionPriority"
      USING ("priority"::text::"AISuggestionPriority");
    ALTER TABLE "ai_suggestions" ALTER COLUMN "priority" SET DEFAULT 'normal';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE "AISuggestionFeedbackAction" AS ENUM ('accepted', 'dismissed', 'ignored');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ai_suggestion_feedback'
      AND column_name = 'action'
      AND udt_name <> 'AISuggestionFeedbackAction'
  ) THEN
    ALTER TABLE "ai_suggestion_feedback"
      ALTER COLUMN "action" TYPE "AISuggestionFeedbackAction"
      USING ("action"::text::"AISuggestionFeedbackAction");
  END IF;
END $$;
