-- Consent gate for conversation-inferred UserAIContext (pending until user promotes)
ALTER TABLE "user_ai_context" ADD COLUMN IF NOT EXISTS "learningStatus" TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS "user_ai_context_userId_learningStatus_idx" ON "user_ai_context"("userId", "learningStatus");
