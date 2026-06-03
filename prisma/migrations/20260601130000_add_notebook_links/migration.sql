-- CreateEnum
CREATE TYPE "NotebookLinkEntityType" AS ENUM ('PAGE', 'TASK', 'FILE', 'CALENDAR_EVENT', 'CHAT_CONVERSATION', 'PLACE_LISTING');

-- CreateEnum
CREATE TYPE "NotebookLinkRelationshipType" AS ENUM ('REFERENCE', 'ACTION_SOURCE', 'AGENDA', 'EVIDENCE', 'EMBED');

-- CreateEnum
CREATE TYPE "NotebookLinkDirection" AS ENUM ('OUTBOUND', 'INBOUND', 'BIDIRECTIONAL');

-- CreateTable
CREATE TABLE "notebook_links" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "businessId" TEXT,
    "sourceType" "NotebookLinkEntityType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" "NotebookLinkEntityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationshipType" "NotebookLinkRelationshipType" NOT NULL DEFAULT 'REFERENCE',
    "direction" "NotebookLinkDirection" NOT NULL DEFAULT 'OUTBOUND',
    "createdById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "notebook_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notebook_links_dashboardId_sourceType_sourceId_archivedAt_idx" ON "notebook_links"("dashboardId", "sourceType", "sourceId", "archivedAt");

-- CreateIndex
CREATE INDEX "notebook_links_dashboardId_targetType_targetId_archivedAt_idx" ON "notebook_links"("dashboardId", "targetType", "targetId", "archivedAt");

-- CreateIndex
CREATE INDEX "notebook_links_dashboardId_sourceType_sourceId_targetType_arch_idx" ON "notebook_links"("dashboardId", "sourceType", "sourceId", "targetType", "archivedAt");

-- CreateIndex
CREATE INDEX "notebook_links_dashboardId_targetType_targetId_sourceType_ar_idx" ON "notebook_links"("dashboardId", "targetType", "targetId", "sourceType", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "notebook_links_dashboardId_sourceType_sourceId_targetType_tar_key" ON "notebook_links"("dashboardId", "sourceType", "sourceId", "targetType", "targetId", "relationshipType");
