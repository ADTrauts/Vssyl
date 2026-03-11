-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "note_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "businessId" TEXT,
    "parentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_folders_dashboardId_businessId_idx" ON "note_folders"("dashboardId", "businessId");

-- CreateIndex
CREATE INDEX "note_folders_createdById_idx" ON "note_folders"("createdById");

-- CreateIndex
CREATE INDEX "note_folders_parentId_idx" ON "note_folders"("parentId");

-- CreateIndex
CREATE INDEX "notes_folderId_idx" ON "notes"("folderId");

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "note_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folders" ADD CONSTRAINT "note_folders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "note_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
