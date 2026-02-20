-- CreateTable
CREATE TABLE "ai_extracted_expenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT,
    "documentDate" TEXT,
    "category" TEXT,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "lineItems" JSONB,
    "sourceFileId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_extracted_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_extracted_expenses_userId_idx" ON "ai_extracted_expenses"("userId");

-- CreateIndex
CREATE INDEX "ai_extracted_expenses_createdAt_idx" ON "ai_extracted_expenses"("createdAt");

-- AddForeignKey
ALTER TABLE "ai_extracted_expenses" ADD CONSTRAINT "ai_extracted_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
