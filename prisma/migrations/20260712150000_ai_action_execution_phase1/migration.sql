-- Phase 1: AI mutating action execution / idempotency ledger
CREATE TABLE IF NOT EXISTS "ai_action_executions" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "actionName" TEXT NOT NULL,
    "argsHash" TEXT NOT NULL,
    "approvalId" TEXT,
    "requestId" TEXT,
    "conversationId" TEXT,
    "riskCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "authorized" BOOLEAN NOT NULL DEFAULT false,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "idempotentReplay" BOOLEAN NOT NULL DEFAULT false,
    "resultJson" JSONB,
    "errorMessage" TEXT,
    "activityId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "firstAttemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_action_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_action_executions_idempotencyKey_key" ON "ai_action_executions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "ai_action_executions_userId_actionName_idx" ON "ai_action_executions"("userId", "actionName");
CREATE INDEX IF NOT EXISTS "ai_action_executions_businessId_idx" ON "ai_action_executions"("businessId");
CREATE INDEX IF NOT EXISTS "ai_action_executions_approvalId_idx" ON "ai_action_executions"("approvalId");
CREATE INDEX IF NOT EXISTS "ai_action_executions_status_idx" ON "ai_action_executions"("status");

DO $$ BEGIN
  ALTER TABLE "ai_action_executions" ADD CONSTRAINT "ai_action_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
