-- CreateEnum
CREATE TYPE "PlaceTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlaceTransactionType" AS ENUM ('PURCHASE', 'EXTERNAL_CLICK', 'RESERVATION');

-- CreateTable
CREATE TABLE "place_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "PlaceTransactionType" NOT NULL,
    "status" "PlaceTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "vssylFee" DOUBLE PRECISION,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "description" TEXT,
    "externalService" TEXT,
    "externalUrl" TEXT,
    "interactionLinkId" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "receiptData" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_interaction_clicks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "interactionLinkId" TEXT NOT NULL,
    "externalService" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_interaction_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "place_transactions_stripePaymentIntentId_key" ON "place_transactions"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "place_transactions_userId_idx" ON "place_transactions"("userId");

-- CreateIndex
CREATE INDEX "place_transactions_businessId_idx" ON "place_transactions"("businessId");

-- CreateIndex
CREATE INDEX "place_transactions_status_idx" ON "place_transactions"("status");

-- CreateIndex
CREATE INDEX "place_transactions_createdAt_idx" ON "place_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "place_interaction_clicks_userId_idx" ON "place_interaction_clicks"("userId");

-- CreateIndex
CREATE INDEX "place_interaction_clicks_businessId_idx" ON "place_interaction_clicks"("businessId");

-- CreateIndex
CREATE INDEX "place_interaction_clicks_interactionLinkId_idx" ON "place_interaction_clicks"("interactionLinkId");

-- CreateIndex
CREATE INDEX "place_interaction_clicks_createdAt_idx" ON "place_interaction_clicks"("createdAt");

-- AddForeignKey
ALTER TABLE "place_transactions" ADD CONSTRAINT "place_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_transactions" ADD CONSTRAINT "place_transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_interaction_clicks" ADD CONSTRAINT "place_interaction_clicks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
