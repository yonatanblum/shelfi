-- Persist uploaded shelf images in Postgres so they survive Render redeploys.
ALTER TABLE "ShelfAnalysis" ADD COLUMN "imageData" BYTEA;
ALTER TABLE "ShelfAnalysis" ADD COLUMN "imageMimeType" TEXT;
