-- AI conversation thread memory (cross-session summaries)
ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "threadSummary" TEXT;
ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "topics" JSONB;
