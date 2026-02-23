-- CreateTable
CREATE TABLE "place_dismissed_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'dismissed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_dismissed_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_dismissed_suggestions_userId_idx" ON "place_dismissed_suggestions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "place_dismissed_suggestions_userId_businessId_key" ON "place_dismissed_suggestions"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "place_dismissed_suggestions" ADD CONSTRAINT "place_dismissed_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
