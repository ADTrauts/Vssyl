-- CreateTable
CREATE TABLE "note_shares" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_shares_sharedWithUserId_idx" ON "note_shares"("sharedWithUserId");

-- CreateIndex
CREATE INDEX "note_shares_noteId_idx" ON "note_shares"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "note_shares_noteId_sharedWithUserId_key" ON "note_shares"("noteId", "sharedWithUserId");

-- AddForeignKey
ALTER TABLE "note_shares" ADD CONSTRAINT "note_shares_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_shares" ADD CONSTRAINT "note_shares_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_shares" ADD CONSTRAINT "note_shares_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
