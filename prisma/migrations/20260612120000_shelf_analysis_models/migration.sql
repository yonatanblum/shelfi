-- Drop legacy product table from the initial POC schema.
DROP TABLE IF EXISTS "Product";

-- CreateTable
CREATE TABLE IF NOT EXISTS "ShelfAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "sourceImage" TEXT,
    "pocProject" TEXT,
    "targetClient" TEXT,
    "confidenceScore" REAL NOT NULL,
    "totalShelvesDetected" INTEGER NOT NULL,
    "estimatedUniqueItems" INTEGER NOT NULL,
    "shareOfShelfByBrand" JSONB NOT NULL,
    "premiumPlacementUtilization" JSONB NOT NULL,
    "overallPriceTagCompliance" REAL NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Shelf" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "shelfLevel" INTEGER NOT NULL,
    "positionDescription" TEXT NOT NULL,
    "zoneQuality" TEXT NOT NULL,
    CONSTRAINT "Shelf_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ShelfAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ShelfItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shelfId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "packagingVariant" TEXT NOT NULL,
    "visibleFacings" INTEGER NOT NULL,
    "isStacked" BOOLEAN NOT NULL,
    "isNested" BOOLEAN NOT NULL,
    "priceTagDetected" BOOLEAN NOT NULL,
    "priceAmount" REAL,
    "priceCurrency" TEXT,
    "visualNotes" TEXT NOT NULL,
    CONSTRAINT "ShelfItem_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
