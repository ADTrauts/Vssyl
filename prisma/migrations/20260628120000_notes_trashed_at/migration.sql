-- Notes Global Trash alignment (Batch 2): trashedAt mirrors platform soft-delete standard

ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);

UPDATE "notes" SET "trashedAt" = "deletedAt" WHERE "deletedAt" IS NOT NULL AND "trashedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "notes_trashedAt_idx" ON "notes"("trashedAt");
