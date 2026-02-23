-- CreateEnum
CREATE TYPE "MeetingPlaceStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MeetingInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "place_meeting_places" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "businessId" TEXT,
    "locationName" TEXT NOT NULL,
    "locationAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "duration" INTEGER,
    "eventId" TEXT,
    "status" "MeetingPlaceStatus" NOT NULL DEFAULT 'PROPOSED',
    "note" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_meeting_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_meeting_invites" (
    "id" TEXT NOT NULL,
    "meetingPlaceId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "status" "MeetingInviteStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_meeting_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_location_privacy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareLocationWithConnections" BOOLEAN NOT NULL DEFAULT false,
    "showOnMeetingPlaces" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_location_privacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "place_meeting_places_creatorId_idx" ON "place_meeting_places"("creatorId");

-- CreateIndex
CREATE INDEX "place_meeting_places_businessId_idx" ON "place_meeting_places"("businessId");

-- CreateIndex
CREATE INDEX "place_meeting_places_scheduledAt_idx" ON "place_meeting_places"("scheduledAt");

-- CreateIndex
CREATE INDEX "place_meeting_places_status_idx" ON "place_meeting_places"("status");

-- CreateIndex
CREATE INDEX "place_meeting_invites_inviteeId_idx" ON "place_meeting_invites"("inviteeId");

-- CreateIndex
CREATE INDEX "place_meeting_invites_status_idx" ON "place_meeting_invites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "place_meeting_invites_meetingPlaceId_inviteeId_key" ON "place_meeting_invites"("meetingPlaceId", "inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "place_location_privacy_userId_key" ON "place_location_privacy"("userId");

-- AddForeignKey
ALTER TABLE "place_meeting_places" ADD CONSTRAINT "place_meeting_places_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_meeting_invites" ADD CONSTRAINT "place_meeting_invites_meetingPlaceId_fkey" FOREIGN KEY ("meetingPlaceId") REFERENCES "place_meeting_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_meeting_invites" ADD CONSTRAINT "place_meeting_invites_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_location_privacy" ADD CONSTRAINT "place_location_privacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
