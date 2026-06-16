-- Scheduling Global Trash alignment (CO-04): trashedAt on schedules, shifts, templates
-- ARCHIVED schedule status remains a distinct business state; not conflated with trash.

ALTER TABLE "schedules" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);
ALTER TABLE "schedule_shifts" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);
ALTER TABLE "schedule_templates" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "schedules_trashedAt_idx" ON "schedules"("trashedAt");
CREATE INDEX IF NOT EXISTS "schedule_shifts_trashedAt_idx" ON "schedule_shifts"("trashedAt");
CREATE INDEX IF NOT EXISTS "schedule_templates_trashedAt_idx" ON "schedule_templates"("trashedAt");
