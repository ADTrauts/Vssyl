-- MP-Q2: Persist structural certification results on module versions for admin review history.

CREATE TYPE "ModuleCertificationStatus" AS ENUM ('NOT_RUN', 'PASSED', 'WARNING', 'FAILED');

ALTER TABLE "module_versions"
  ADD COLUMN "certificationStatus" "ModuleCertificationStatus" NOT NULL DEFAULT 'NOT_RUN',
  ADD COLUMN "certificationErrors" JSONB,
  ADD COLUMN "certificationWarnings" JSONB,
  ADD COLUMN "certificationChecklist" JSONB,
  ADD COLUMN "certificationValidatedAt" TIMESTAMP(3),
  ADD COLUMN "certificationValidatorVersion" TEXT;

CREATE INDEX "module_versions_certificationStatus_idx" ON "module_versions"("certificationStatus");
