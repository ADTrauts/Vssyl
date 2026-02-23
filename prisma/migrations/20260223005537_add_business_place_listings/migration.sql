-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('RESTAURANT', 'RETAIL', 'GROCERY', 'DIGITAL_SERVICE', 'DELIVERY', 'LOCAL_SERVICE', 'HEALTH_WELLNESS', 'ENTERTAINMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InteractionLinkType" AS ENUM ('WEBSITE', 'DOORDASH', 'UBEREATS', 'INSTACART', 'OPENTABLE', 'RESY', 'FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'YELP', 'GOOGLE_MAPS', 'CUSTOM');

-- CreateTable
CREATE TABLE "business_place_listings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT,
    "shortDescription" TEXT,
    "coverImage" TEXT,
    "category" "PlaceCategory" NOT NULL DEFAULT 'OTHER',
    "tags" TEXT[],
    "nodeColor" TEXT,
    "nodeShape" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_place_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_interaction_links" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "InteractionLinkType" NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_interaction_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_place_listings_businessId_key" ON "business_place_listings"("businessId");

-- CreateIndex
CREATE INDEX "business_place_listings_category_idx" ON "business_place_listings"("category");

-- CreateIndex
CREATE INDEX "business_place_listings_isEnabled_isPublished_idx" ON "business_place_listings"("isEnabled", "isPublished");

-- CreateIndex
CREATE INDEX "business_interaction_links_listingId_idx" ON "business_interaction_links"("listingId");

-- CreateIndex
CREATE INDEX "business_interaction_links_sortOrder_idx" ON "business_interaction_links"("sortOrder");

-- AddForeignKey
ALTER TABLE "business_place_listings" ADD CONSTRAINT "business_place_listings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_interaction_links" ADD CONSTRAINT "business_interaction_links_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "business_place_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
