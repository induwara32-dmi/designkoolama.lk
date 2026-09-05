-- Additive category-page content and banner media. Existing categories, projects, snapshots, and media are preserved.
ALTER TABLE "PortfolioCategory"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "overview" TEXT,
  ADD COLUMN "bannerMediaId" UUID;

UPDATE "PortfolioCategory"
SET
  "shortDescription" = COALESCE("description", 'Explore selected work from this DesignKoolama portfolio category.'),
  "overview" = COALESCE("description", 'Explore selected work from this DesignKoolama portfolio category.'),
  "publishedSnapshot" = COALESCE("publishedSnapshot", '{}'::jsonb) || jsonb_build_object(
    'shortDescription', COALESCE("description", 'Explore selected work from this DesignKoolama portfolio category.'),
    'overview', COALESCE("description", 'Explore selected work from this DesignKoolama portfolio category.'),
    'bannerMedia', NULL
  )
WHERE "shortDescription" IS NULL OR "overview" IS NULL;

ALTER TABLE "PortfolioCategory"
  ADD CONSTRAINT "PortfolioCategory_bannerMediaId_fkey"
  FOREIGN KEY ("bannerMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
