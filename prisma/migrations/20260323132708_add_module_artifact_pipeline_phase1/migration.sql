-- CreateEnum
CREATE TYPE "ModuleVersionStatus" AS ENUM ('DRAFT', 'UPLOADED', 'SCANNING', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ModuleScanStatus" AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ModuleUploadSessionStatus" AS ENUM ('INITIATED', 'UPLOADING', 'FINALIZED', 'EXPIRED', 'ABORTED');

-- CreateTable
CREATE TABLE "module_versions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "ModuleVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "manifestSnapshot" JSONB NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "rejectedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_artifacts" (
    "id" TEXT NOT NULL,
    "moduleVersionId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanStatus" "ModuleScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanSummary" JSONB,

    CONSTRAINT "module_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_upload_sessions" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "targetVersion" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "status" "ModuleUploadSessionStatus" NOT NULL DEFAULT 'INITIATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_upload_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_versions_moduleId_status_idx" ON "module_versions"("moduleId", "status");

-- CreateIndex
CREATE INDEX "module_versions_moduleId_isCurrent_idx" ON "module_versions"("moduleId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "module_versions_moduleId_version_key" ON "module_versions"("moduleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "module_artifacts_moduleVersionId_key" ON "module_artifacts"("moduleVersionId");

-- CreateIndex
CREATE INDEX "module_artifacts_scanStatus_idx" ON "module_artifacts"("scanStatus");

-- CreateIndex
CREATE INDEX "module_artifacts_uploadedBy_idx" ON "module_artifacts"("uploadedBy");

-- CreateIndex
CREATE INDEX "module_upload_sessions_moduleId_status_idx" ON "module_upload_sessions"("moduleId", "status");

-- CreateIndex
CREATE INDEX "module_upload_sessions_uploaderId_idx" ON "module_upload_sessions"("uploaderId");

-- CreateIndex
CREATE INDEX "module_upload_sessions_expiresAt_idx" ON "module_upload_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "module_versions" ADD CONSTRAINT "module_versions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_artifacts" ADD CONSTRAINT "module_artifacts_moduleVersionId_fkey" FOREIGN KEY ("moduleVersionId") REFERENCES "module_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_upload_sessions" ADD CONSTRAINT "module_upload_sessions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
