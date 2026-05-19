CREATE TABLE IF NOT EXISTS "ai_message_recall_index" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contentSnippet" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "businessId" TEXT,
    "dashboardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_recall_index_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_message_recall_index_messageId_key" ON "ai_message_recall_index"("messageId");
CREATE INDEX IF NOT EXISTS "ai_message_recall_index_userId_createdAt_idx" ON "ai_message_recall_index"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_message_recall_index_conversationId_idx" ON "ai_message_recall_index"("conversationId");

ALTER TABLE "ai_message_recall_index" ADD CONSTRAINT "ai_message_recall_index_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
