-- CreateEnum
CREATE TYPE "AIPipelineDiagnosticSource" AS ENUM ('TWIN', 'TEST_LAB');

-- CreateTable
CREATE TABLE "ai_pipeline_diagnostics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationHistoryId" TEXT,
    "conversationId" TEXT,
    "source" "AIPipelineDiagnosticSource" NOT NULL DEFAULT 'TWIN',
    "genericResponseRisk" BOOLEAN NOT NULL DEFAULT false,
    "groundingRequired" BOOLEAN NOT NULL DEFAULT false,
    "retrievalPerformed" BOOLEAN NOT NULL DEFAULT false,
    "confidenceLevel" TEXT NOT NULL,
    "intentDetected" TEXT[],
    "issues" JSONB NOT NULL DEFAULT '[]',
    "traceJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_pipeline_diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_pipeline_diagnostics_userId_idx" ON "ai_pipeline_diagnostics"("userId");

-- CreateIndex
CREATE INDEX "ai_pipeline_diagnostics_createdAt_idx" ON "ai_pipeline_diagnostics"("createdAt");

-- CreateIndex
CREATE INDEX "ai_pipeline_diagnostics_genericResponseRisk_idx" ON "ai_pipeline_diagnostics"("genericResponseRisk");

-- CreateIndex
CREATE INDEX "ai_pipeline_diagnostics_conversationHistoryId_idx" ON "ai_pipeline_diagnostics"("conversationHistoryId");

-- CreateIndex
CREATE INDEX "ai_pipeline_diagnostics_source_idx" ON "ai_pipeline_diagnostics"("source");

-- AddForeignKey
ALTER TABLE "ai_pipeline_diagnostics" ADD CONSTRAINT "ai_pipeline_diagnostics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_pipeline_diagnostics" ADD CONSTRAINT "ai_pipeline_diagnostics_conversationHistoryId_fkey" FOREIGN KEY ("conversationHistoryId") REFERENCES "ai_conversation_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;
