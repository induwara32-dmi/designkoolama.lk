-- Additive direct category gallery. Existing projects, media, snapshots, and category relations are preserved.
CREATE TABLE "PortfolioCategoryGalleryImage" (
  "id" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "mediaId" UUID NOT NULL,
  "altText" TEXT,
  "caption" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioCategoryGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioCategoryGalleryImage_categoryId_mediaId_key"
  ON "PortfolioCategoryGalleryImage"("categoryId", "mediaId");
CREATE INDEX "PortfolioCategoryGalleryImage_categoryId_displayOrder_idx"
  ON "PortfolioCategoryGalleryImage"("categoryId", "displayOrder");
ALTER TABLE "PortfolioCategoryGalleryImage"
  ADD CONSTRAINT "PortfolioCategoryGalleryImage_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "PortfolioCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioCategoryGalleryImage"
  ADD CONSTRAINT "PortfolioCategoryGalleryImage_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
