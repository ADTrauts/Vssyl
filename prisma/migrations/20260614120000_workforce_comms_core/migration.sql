-- Workforce Communications Phase A: core data model + V_Link entity types

-- CreateEnum
CREATE TYPE "WorkforceCommunicationType" AS ENUM (
  'ANNOUNCEMENT',
  'DEPARTMENT_BROADCAST',
  'LEADERSHIP_MESSAGE',
  'SCHEDULE_NOTICE',
  'HR_BROADCAST',
  'POLICY_COMPLIANCE',
  'EMERGENCY_ALERT'
);

CREATE TYPE "WorkforceCommunicationStatus" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'EXPIRED',
  'CANCELLED'
);

CREATE TYPE "WorkforcePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "WorkforceCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TYPE "WorkforceAudienceType" AS ENUM (
  'BUSINESS',
  'DEPARTMENT',
  'EMPLOYEE_POSITION',
  'POSITION',
  'TIER',
  'MANAGER_SUBTREE',
  'BUSINESS_ROLE',
  'CUSTOM_GROUP'
);

CREATE TYPE "WorkforceEngagementSource" AS ENUM (
  'HUB',
  'FRONT_PAGE',
  'NOTIFICATION',
  'EMAIL',
  'MOBILE'
);

CREATE TYPE "WorkforceDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

CREATE TYPE "WorkforceBridgeKind" AS ENUM (
  'SCHEDULE_PUBLISHED',
  'HR_POLICY_UPDATE',
  'MANUAL'
);

-- V_Link entity types
ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'WORKFORCE_COMMUNICATION';
ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'WORKFORCE_CAMPAIGN';

-- CreateTable
CREATE TABLE "workforce_campaigns" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkforceCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workforce_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_communications" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "communicationType" "WorkforceCommunicationType" NOT NULL,
    "priority" "WorkforcePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "WorkforceCommunicationStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "requiresAck" BOOLEAN NOT NULL DEFAULT false,
    "requiresRead" BOOLEAN NOT NULL DEFAULT true,
    "showOnFrontPage" BOOLEAN NOT NULL DEFAULT false,
    "showInHubFeed" BOOLEAN NOT NULL DEFAULT true,
    "campaignId" TEXT,
    "legacyFrontPageId" TEXT,
    "trashedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workforce_communications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_audiences" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "audienceType" "WorkforceAudienceType" NOT NULL,
    "spec" JSONB NOT NULL,
    "estimatedCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workforce_audiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_audience_resolutions" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeePositionId" TEXT,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "workforce_audience_resolutions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_read_receipts" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "WorkforceEngagementSource" NOT NULL DEFAULT 'HUB',

    CONSTRAINT "workforce_read_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_acknowledgements" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "workforce_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_attachments" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "fileId" TEXT,
    "label" TEXT,
    "url" TEXT,
    "mimeType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "trashedAt" TIMESTAMP(3),

    CONSTRAINT "workforce_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_delivery_logs" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT,
    "channel" TEXT NOT NULL,
    "status" "WorkforceDeliveryStatus" NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "workforce_delivery_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workforce_bridge_refs" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "sourceModuleId" TEXT NOT NULL,
    "sourceEntityType" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "bridgeKind" "WorkforceBridgeKind" NOT NULL,

    CONSTRAINT "workforce_bridge_refs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workforce_campaigns_businessId_name_key" ON "workforce_campaigns"("businessId", "name");
CREATE INDEX "workforce_campaigns_businessId_trashedAt_idx" ON "workforce_campaigns"("businessId", "trashedAt");

CREATE INDEX "workforce_communications_businessId_status_idx" ON "workforce_communications"("businessId", "status");
CREATE INDEX "workforce_communications_businessId_trashedAt_idx" ON "workforce_communications"("businessId", "trashedAt");
CREATE INDEX "workforce_communications_businessId_publishedAt_idx" ON "workforce_communications"("businessId", "publishedAt");

CREATE UNIQUE INDEX "workforce_audiences_communicationId_key" ON "workforce_audiences"("communicationId");

CREATE UNIQUE INDEX "workforce_audience_resolutions_communicationId_userId_key" ON "workforce_audience_resolutions"("communicationId", "userId");
CREATE INDEX "workforce_audience_resolutions_communicationId_idx" ON "workforce_audience_resolutions"("communicationId");
CREATE INDEX "workforce_audience_resolutions_userId_idx" ON "workforce_audience_resolutions"("userId");

CREATE UNIQUE INDEX "workforce_read_receipts_communicationId_userId_key" ON "workforce_read_receipts"("communicationId", "userId");

CREATE UNIQUE INDEX "workforce_acknowledgements_communicationId_userId_key" ON "workforce_acknowledgements"("communicationId", "userId");

CREATE INDEX "workforce_attachments_communicationId_idx" ON "workforce_attachments"("communicationId");

CREATE INDEX "workforce_delivery_logs_communicationId_idx" ON "workforce_delivery_logs"("communicationId");

CREATE INDEX "workforce_bridge_refs_sourceModuleId_sourceEntityId_idx" ON "workforce_bridge_refs"("sourceModuleId", "sourceEntityId");

-- AddForeignKey
ALTER TABLE "workforce_campaigns" ADD CONSTRAINT "workforce_campaigns_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_campaigns" ADD CONSTRAINT "workforce_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_communications" ADD CONSTRAINT "workforce_communications_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_communications" ADD CONSTRAINT "workforce_communications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_communications" ADD CONSTRAINT "workforce_communications_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "workforce_communications" ADD CONSTRAINT "workforce_communications_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "workforce_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "workforce_audiences" ADD CONSTRAINT "workforce_audiences_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_audience_resolutions" ADD CONSTRAINT "workforce_audience_resolutions_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_audience_resolutions" ADD CONSTRAINT "workforce_audience_resolutions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_read_receipts" ADD CONSTRAINT "workforce_read_receipts_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_read_receipts" ADD CONSTRAINT "workforce_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_acknowledgements" ADD CONSTRAINT "workforce_acknowledgements_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_acknowledgements" ADD CONSTRAINT "workforce_acknowledgements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_attachments" ADD CONSTRAINT "workforce_attachments_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_attachments" ADD CONSTRAINT "workforce_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "workforce_delivery_logs" ADD CONSTRAINT "workforce_delivery_logs_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_delivery_logs" ADD CONSTRAINT "workforce_delivery_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workforce_bridge_refs" ADD CONSTRAINT "workforce_bridge_refs_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "workforce_communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
