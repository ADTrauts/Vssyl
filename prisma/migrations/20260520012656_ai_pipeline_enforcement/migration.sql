-- CreateEnum
CREATE TYPE "AIPipelineEnforcementMode" AS ENUM ('OFF', 'DISCLOSE', 'BLOCK', 'REGENERATE');

-- AlterTable
ALTER TABLE "ai_pipeline_settings" ADD COLUMN     "enforcementEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enforcementMode" "AIPipelineEnforcementMode" NOT NULL DEFAULT 'OFF';
