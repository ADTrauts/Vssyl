-- CreateEnum
CREATE TYPE "PlaceCommunityType" AS ENUM ('AUTO_CLUSTER', 'USER_CREATED');

-- CreateEnum
CREATE TYPE "PlaceActivityType" AS ENUM ('FOLLOWED_BUSINESS', 'UNFOLLOWED_BUSINESS', 'ADDED_CONNECTION', 'MEETING_CREATED', 'MEETING_CONFIRMED', 'TRANSACTION_COMPLETED', 'EXTERNAL_CLICK', 'COMMUNITY_JOINED', 'PLACE_SETUP_COMPLETE', 'INTEREST_ADDED');

-- CreateTable
CREATE TABLE "place_communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PlaceCommunityType" NOT NULL DEFAULT 'USER_CREATED',
    "creatorId" TEXT,
    "coverImage" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_community_members" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_activity_feed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PlaceActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "businessId" TEXT,
    "targetUserId" TEXT,
    "meetingId" TEXT,
    "transactionId" TEXT,
    "communityId" TEXT,
    "metadata" JSONB,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_activity_feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalNodes" INTEGER NOT NULL DEFAULT 0,
    "businessNodes" INTEGER NOT NULL DEFAULT 0,
    "userConnections" INTEGER NOT NULL DEFAULT 0,
    "totalInterests" INTEGER NOT NULL DEFAULT 0,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "externalClicks" INTEGER NOT NULL DEFAULT 0,
    "meetingsCreated" INTEGER NOT NULL DEFAULT 0,
    "meetingsAttended" INTEGER NOT NULL DEFAULT 0,
    "communitiesJoined" INTEGER NOT NULL DEFAULT 0,
    "topCategories" JSONB,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_communities_type_idx" ON "place_communities"("type");

-- CreateIndex
CREATE INDEX "place_communities_creatorId_idx" ON "place_communities"("creatorId");

-- CreateIndex
CREATE INDEX "place_community_members_userId_idx" ON "place_community_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "place_community_members_communityId_userId_key" ON "place_community_members"("communityId", "userId");

-- CreateIndex
CREATE INDEX "place_activity_feed_userId_idx" ON "place_activity_feed"("userId");

-- CreateIndex
CREATE INDEX "place_activity_feed_type_idx" ON "place_activity_feed"("type");

-- CreateIndex
CREATE INDEX "place_activity_feed_createdAt_idx" ON "place_activity_feed"("createdAt");

-- CreateIndex
CREATE INDEX "place_analytics_snapshots_userId_idx" ON "place_analytics_snapshots"("userId");

-- CreateIndex
CREATE INDEX "place_analytics_snapshots_periodStart_idx" ON "place_analytics_snapshots"("periodStart");

-- AddForeignKey
ALTER TABLE "place_communities" ADD CONSTRAINT "place_communities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_community_members" ADD CONSTRAINT "place_community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "place_communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_community_members" ADD CONSTRAINT "place_community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_activity_feed" ADD CONSTRAINT "place_activity_feed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_analytics_snapshots" ADD CONSTRAINT "place_analytics_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
