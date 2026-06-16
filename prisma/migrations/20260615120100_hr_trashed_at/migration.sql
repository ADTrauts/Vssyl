-- HR Global Trash alignment (CO-04): trashedAt mirrors platform soft-delete standard

ALTER TABLE "employee_hr_profiles" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);

UPDATE "employee_hr_profiles" SET "trashedAt" = "deletedAt" WHERE "deletedAt" IS NOT NULL AND "trashedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "employee_hr_profiles_trashedAt_idx" ON "employee_hr_profiles"("trashedAt");
