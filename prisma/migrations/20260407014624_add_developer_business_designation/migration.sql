-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "developerBusinessLinkedAt" TIMESTAMP(3),
ADD COLUMN     "developerBusinessLinkedBy" TEXT,
ADD COLUMN     "isDeveloperBusiness" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "businesses_isDeveloperBusiness_idx" ON "businesses"("isDeveloperBusiness");
