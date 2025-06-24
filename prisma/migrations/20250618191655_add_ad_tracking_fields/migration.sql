-- CreateTable
CREATE TABLE "TrackingBoundary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "lastKnownAdId" TEXT NOT NULL,
    "lastKnownAdDate" DATETIME NOT NULL,
    "lastKnownAdCreatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrackingBoundary_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libraryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "text" TEXT,
    "headline" TEXT,
    "description" TEXT,
    "localImageUrl" TEXT,
    "localVideoUrl" TEXT,
    "localImageUrls" TEXT,
    "mediaStatus" TEXT NOT NULL DEFAULT 'pending',
    "mediaDownloadedAt" DATETIME,
    "mediaError" TEXT,
    "mediaRetryCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brandId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ad_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ad" ("brandId", "content", "createdAt", "description", "headline", "id", "imageUrl", "libraryId", "localImageUrl", "localVideoUrl", "mediaDownloadedAt", "mediaError", "mediaRetryCount", "mediaStatus", "text", "type", "updatedAt", "videoUrl") SELECT "brandId", "content", "createdAt", "description", "headline", "id", "imageUrl", "libraryId", "localImageUrl", "localVideoUrl", "mediaDownloadedAt", "mediaError", "mediaRetryCount", "mediaStatus", "text", "type", "updatedAt", "videoUrl" FROM "Ad";
DROP TABLE "Ad";
ALTER TABLE "new_Ad" RENAME TO "Ad";
CREATE UNIQUE INDEX "Ad_libraryId_key" ON "Ad"("libraryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TrackingBoundary_brandId_key" ON "TrackingBoundary"("brandId");
