-- Place Wave 2A: Global Trash + V_Link entity types for listing and meeting

ALTER TABLE "business_place_listings" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "business_place_listings_trashedAt_idx" ON "business_place_listings"("trashedAt");

ALTER TABLE "place_meeting_places" ADD COLUMN IF NOT EXISTS "trashedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "place_meeting_places_trashedAt_idx" ON "place_meeting_places"("trashedAt");

ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'PLACE_LISTING';
ALTER TYPE "VLinkEntityType" ADD VALUE IF NOT EXISTS 'PLACE_MEETING';
