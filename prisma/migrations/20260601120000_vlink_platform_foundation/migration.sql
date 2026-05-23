-- CreateEnum
CREATE TYPE "VLinkScope" AS ENUM ('PERSONAL', 'BUSINESS', 'HOUSEHOLD');

-- CreateEnum
CREATE TYPE "VLinkStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "VLinkMemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "VLinkEntityType" AS ENUM ('FILE', 'FOLDER', 'CALENDAR_EVENT', 'CHAT_CONVERSATION', 'CHAT_THREAD', 'TASK', 'TODO', 'NOTE', 'DASHBOARD', 'WIDGET', 'USER', 'BUSINESS', 'HOUSEHOLD', 'MODULE_ENTITY');

-- CreateEnum
CREATE TYPE "VLinkEntityRelationType" AS ENUM ('PRIMARY', 'REFERENCE');

-- CreateEnum
CREATE TYPE "VLinkEntitySource" AS ENUM ('MANUAL', 'AI_SUGGESTED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "VLinkSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VLinkSuggestionSource" AS ENUM ('AI', 'SYSTEM');

-- CreateTable
CREATE TABLE "v_links" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scope" "VLinkScope" NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "businessId" TEXT,
    "householdId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "parentVLinkId" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "status" "VLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "v_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vlink_members" (
    "id" TEXT NOT NULL,
    "vlinkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "VLinkMemberRole" NOT NULL,
    "invitedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vlink_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vlink_entities" (
    "id" TEXT NOT NULL,
    "vlinkId" TEXT NOT NULL,
    "entityType" "VLinkEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "moduleId" TEXT,
    "relationType" "VLinkEntityRelationType" NOT NULL DEFAULT 'PRIMARY',
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "linkedById" TEXT NOT NULL,
    "source" "VLinkEntitySource" NOT NULL DEFAULT 'MANUAL',
    "metadata" JSONB,
    "unlinkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vlink_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vlink_suggestions" (
    "id" TEXT NOT NULL,
    "vlinkId" TEXT,
    "suggestedTitle" TEXT,
    "entityType" "VLinkEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "moduleId" TEXT,
    "suggestedBy" "VLinkSuggestionSource" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "reasonCodes" JSONB,
    "explanation" TEXT,
    "status" "VLinkSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "dashboardId" TEXT,
    "businessId" TEXT,
    "householdId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vlink_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vlink_activities" (
    "id" TEXT NOT NULL,
    "vlinkId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" "VLinkEntityType",
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vlink_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "v_links_publicCode_key" ON "v_links"("publicCode");

-- CreateIndex
CREATE INDEX "v_links_dashboardId_businessId_householdId_idx" ON "v_links"("dashboardId", "businessId", "householdId");

-- CreateIndex
CREATE INDEX "v_links_ownerUserId_idx" ON "v_links"("ownerUserId");

-- CreateIndex
CREATE INDEX "v_links_parentVLinkId_idx" ON "v_links"("parentVLinkId");

-- CreateIndex
CREATE INDEX "v_links_status_idx" ON "v_links"("status");

-- CreateIndex
CREATE INDEX "v_links_publicCode_idx" ON "v_links"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "vlink_members_vlinkId_userId_key" ON "vlink_members"("vlinkId", "userId");

-- CreateIndex
CREATE INDEX "vlink_members_userId_idx" ON "vlink_members"("userId");

-- CreateIndex
CREATE INDEX "vlink_members_vlinkId_idx" ON "vlink_members"("vlinkId");

-- CreateIndex
CREATE UNIQUE INDEX "vlink_entities_vlinkId_entityType_entityId_key" ON "vlink_entities"("vlinkId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "vlink_entities_entityType_entityId_idx" ON "vlink_entities"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "vlink_entities_vlinkId_idx" ON "vlink_entities"("vlinkId");

-- Partial unique: one active primary link per entity
CREATE UNIQUE INDEX "vlink_entities_one_primary_per_entity"
ON "vlink_entities" ("entityType", "entityId")
WHERE "relationType" = 'PRIMARY' AND "isPrimary" = true AND "unlinkedAt" IS NULL;

-- CreateIndex
CREATE INDEX "vlink_suggestions_userId_status_idx" ON "vlink_suggestions"("userId", "status");

-- CreateIndex
CREATE INDEX "vlink_suggestions_vlinkId_idx" ON "vlink_suggestions"("vlinkId");

-- CreateIndex
CREATE INDEX "vlink_suggestions_entityType_entityId_idx" ON "vlink_suggestions"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "vlink_activities_vlinkId_createdAt_idx" ON "vlink_activities"("vlinkId", "createdAt");

-- AddForeignKey
ALTER TABLE "v_links" ADD CONSTRAINT "v_links_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v_links" ADD CONSTRAINT "v_links_parentVLinkId_fkey" FOREIGN KEY ("parentVLinkId") REFERENCES "v_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v_links" ADD CONSTRAINT "v_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "v_links" ADD CONSTRAINT "v_links_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_members" ADD CONSTRAINT "vlink_members_vlinkId_fkey" FOREIGN KEY ("vlinkId") REFERENCES "v_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_members" ADD CONSTRAINT "vlink_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_members" ADD CONSTRAINT "vlink_members_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_entities" ADD CONSTRAINT "vlink_entities_vlinkId_fkey" FOREIGN KEY ("vlinkId") REFERENCES "v_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_entities" ADD CONSTRAINT "vlink_entities_linkedById_fkey" FOREIGN KEY ("linkedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_suggestions" ADD CONSTRAINT "vlink_suggestions_vlinkId_fkey" FOREIGN KEY ("vlinkId") REFERENCES "v_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_suggestions" ADD CONSTRAINT "vlink_suggestions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_suggestions" ADD CONSTRAINT "vlink_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_activities" ADD CONSTRAINT "vlink_activities_vlinkId_fkey" FOREIGN KEY ("vlinkId") REFERENCES "v_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vlink_activities" ADD CONSTRAINT "vlink_activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
