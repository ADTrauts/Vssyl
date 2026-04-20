-- Scalar list `tags` must never be SQL NULL: Prisma `String[]` reads can fail with NULL column values.
UPDATE "tasks" SET "tags" = '{}'::text[] WHERE "tags" IS NULL;

ALTER TABLE "tasks" ALTER COLUMN "tags" SET DEFAULT '{}'::text[];
ALTER TABLE "tasks" ALTER COLUMN "tags" SET NOT NULL;
