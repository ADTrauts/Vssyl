-- Fix Phase 5A enum types for Prisma client compatibility

ALTER TYPE "AISuggestionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

CREATE TYPE "AISuggestionPriority" AS ENUM ('low', 'normal', 'high');

ALTER TABLE "ai_suggestions" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "ai_suggestions"
  ALTER COLUMN "priority" TYPE "AISuggestionPriority"
  USING ("priority"::"AISuggestionPriority");
ALTER TABLE "ai_suggestions" ALTER COLUMN "priority" SET DEFAULT 'normal';

CREATE TYPE "AISuggestionFeedbackAction" AS ENUM ('accepted', 'dismissed', 'ignored');

ALTER TABLE "ai_suggestion_feedback"
  ALTER COLUMN "action" TYPE "AISuggestionFeedbackAction"
  USING ("action"::"AISuggestionFeedbackAction");
