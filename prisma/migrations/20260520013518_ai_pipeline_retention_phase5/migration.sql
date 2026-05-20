-- AlterTable
ALTER TABLE "ai_pipeline_settings" ADD COLUMN     "diagnosticRetentionDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "exportRedactResponsePreviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "exportRedactUserMessages" BOOLEAN NOT NULL DEFAULT true;
