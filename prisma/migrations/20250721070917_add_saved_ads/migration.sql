-- CreateTable
CREATE TABLE "SavedAdFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAdFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedAd" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "adData" TEXT NOT NULL,
    "folderId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedAd_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SavedAdFolder" ADD CONSTRAINT "SavedAdFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAd" ADD CONSTRAINT "SavedAd_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "SavedAdFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAd" ADD CONSTRAINT "SavedAd_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
