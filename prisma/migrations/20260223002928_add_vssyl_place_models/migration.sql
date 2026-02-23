-- CreateEnum
CREATE TYPE "PlaceNodeType" AS ENUM ('BUSINESS', 'USER', 'MEETING_PLACE');

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Place',
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_nodes" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "nodeType" "PlaceNodeType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "label" TEXT,
    "color" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_settings" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "neighborhoodVisibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "defaultFollowVisibility" BOOLEAN NOT NULL DEFAULT false,
    "layoutMode" TEXT NOT NULL DEFAULT 'FORCE',
    "showLabels" BOOLEAN NOT NULL DEFAULT true,
    "highContrastMode" BOOLEAN NOT NULL DEFAULT false,
    "showLocalSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "suggestionRadius" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_interests" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_follow_visibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_follow_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "places_userId_key" ON "places"("userId");

-- CreateIndex
CREATE INDEX "places_userId_idx" ON "places"("userId");

-- CreateIndex
CREATE INDEX "place_nodes_placeId_idx" ON "place_nodes"("placeId");

-- CreateIndex
CREATE INDEX "place_nodes_entityId_idx" ON "place_nodes"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "place_nodes_placeId_nodeType_entityId_key" ON "place_nodes"("placeId", "nodeType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "place_settings_placeId_key" ON "place_settings"("placeId");

-- CreateIndex
CREATE INDEX "place_interests_placeId_idx" ON "place_interests"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "place_interests_placeId_category_key" ON "place_interests"("placeId", "category");

-- CreateIndex
CREATE INDEX "place_follow_visibility_userId_idx" ON "place_follow_visibility"("userId");

-- CreateIndex
CREATE INDEX "place_follow_visibility_businessId_idx" ON "place_follow_visibility"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "place_follow_visibility_userId_businessId_key" ON "place_follow_visibility"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_nodes" ADD CONSTRAINT "place_nodes_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_settings" ADD CONSTRAINT "place_settings_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_interests" ADD CONSTRAINT "place_interests_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_follow_visibility" ADD CONSTRAINT "place_follow_visibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
