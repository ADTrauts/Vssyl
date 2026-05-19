-- Structured user memory facts for long-term conversational recall
CREATE TABLE IF NOT EXISTS "user_memory_facts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "predicate" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'personal',
    "businessId" TEXT,
    "dashboardId" TEXT,
    "sourceConversationId" TEXT,
    "sourceMessageId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "expiresAt" TIMESTAMP(3),
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memory_facts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_memory_facts_userId_trashedAt_idx" ON "user_memory_facts"("userId", "trashedAt");
CREATE INDEX IF NOT EXISTS "user_memory_facts_userId_scope_idx" ON "user_memory_facts"("userId", "scope");
CREATE INDEX IF NOT EXISTS "user_memory_facts_businessId_idx" ON "user_memory_facts"("businessId");
CREATE INDEX IF NOT EXISTS "user_memory_facts_expiresAt_idx" ON "user_memory_facts"("expiresAt");

ALTER TABLE "user_memory_facts" ADD CONSTRAINT "user_memory_facts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_memory_facts" ADD CONSTRAINT "user_memory_facts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
