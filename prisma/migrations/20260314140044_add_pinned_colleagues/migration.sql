-- CreateTable
CREATE TABLE "pinned_colleagues" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "pinnedUserId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_colleagues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pinned_colleagues_userId_businessId_idx" ON "pinned_colleagues"("userId", "businessId");

-- CreateIndex
CREATE UNIQUE INDEX "pinned_colleagues_userId_businessId_pinnedUserId_key" ON "pinned_colleagues"("userId", "businessId", "pinnedUserId");

-- AddForeignKey
ALTER TABLE "pinned_colleagues" ADD CONSTRAINT "pinned_colleagues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_colleagues" ADD CONSTRAINT "pinned_colleagues_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_colleagues" ADD CONSTRAINT "pinned_colleagues_pinnedUserId_fkey" FOREIGN KEY ("pinnedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
