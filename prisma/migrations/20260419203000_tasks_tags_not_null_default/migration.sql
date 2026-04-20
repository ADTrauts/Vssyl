-- Scalar list `tags` must never be SQL NULL: Prisma `String[]` reads can fail with NULL column values.
-- ADD COLUMN: some production DBs lacked `tags` on `tasks` (error 42703); baseline/CI already have the column (IF NOT EXISTS is a no-op).
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "tags" TEXT[];

UPDATE "tasks" SET "tags" = '{}'::text[] WHERE "tags" IS NULL;

ALTER TABLE "tasks" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];
ALTER TABLE "tasks" ALTER COLUMN "tags" SET NOT NULL;
