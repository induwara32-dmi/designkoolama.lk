-- Additive Portfolio category card publishing metadata. Existing IDs and project relations are preserved.
ALTER TABLE "PortfolioCategory"
  ADD COLUMN "cardTitle" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "iconKey" TEXT,
  ADD COLUMN "cardMediaId" UUID,
  ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "publishedSnapshot" JSONB,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "PortfolioCategory"
SET
  "slug" = CASE WHEN "slug" = 'branding-identity' THEN 'branding-and-identity' ELSE "slug" END,
  "cardTitle" = "name",
  "description" = CASE "name"
    WHEN 'Branding & Identity' THEN 'Distinctive brand systems built to inspire recognition, trust, and growth.'
    WHEN 'Print Advertising' THEN 'Campaign-led print design that communicates clearly and makes a lasting impression.'
    WHEN 'Social Media Design' THEN 'Engaging social content systems designed for consistency, reach, and connection.'
    WHEN 'Packaging Design' THEN 'Memorable packaging experiences that stand out and strengthen product perception.'
    WHEN 'Merchandise Design' THEN 'Purposeful branded merchandise designed to be used, valued, and remembered.'
    WHEN '3D Design' THEN 'Dimensional visual experiences that bring products, spaces, and ideas to life.'
    ELSE 'Explore selected work from this DesignKoolama portfolio category.'
  END,
  "iconKey" = CASE "name"
    WHEN 'Branding & Identity' THEN 'flame'
    WHEN 'Print Advertising' THEN 'pen-tool'
    WHEN 'Social Media Design' THEN 'share'
    WHEN 'Packaging Design' THEN 'box'
    WHEN 'Merchandise Design' THEN 'layers'
    WHEN '3D Design' THEN 'box'
    ELSE 'globe'
  END,
  "status" = 'PUBLISHED',
  "publishedAt" = COALESCE("updatedAt", NOW()),
  "publishedSnapshot" = jsonb_build_object(
    'slug', CASE WHEN "slug" = 'branding-identity' THEN 'branding-and-identity' ELSE "slug" END,
    'name', "name",
    'cardTitle', "name",
    'description', CASE "name"
      WHEN 'Branding & Identity' THEN 'Distinctive brand systems built to inspire recognition, trust, and growth.'
      WHEN 'Print Advertising' THEN 'Campaign-led print design that communicates clearly and makes a lasting impression.'
      WHEN 'Social Media Design' THEN 'Engaging social content systems designed for consistency, reach, and connection.'
      WHEN 'Packaging Design' THEN 'Memorable packaging experiences that stand out and strengthen product perception.'
      WHEN 'Merchandise Design' THEN 'Purposeful branded merchandise designed to be used, valued, and remembered.'
      WHEN '3D Design' THEN 'Dimensional visual experiences that bring products, spaces, and ideas to life.'
      ELSE 'Explore selected work from this DesignKoolama portfolio category.'
    END,
    'iconKey', CASE "name"
      WHEN 'Branding & Identity' THEN 'flame'
      WHEN 'Print Advertising' THEN 'pen-tool'
      WHEN 'Social Media Design' THEN 'share'
      WHEN 'Packaging Design' THEN 'box'
      WHEN 'Merchandise Design' THEN 'layers'
      WHEN '3D Design' THEN 'box'
      ELSE 'globe'
    END,
    'displayOrder', "displayOrder",
    'cardMedia', NULL
  );

ALTER TABLE "PortfolioCategory"
  ADD CONSTRAINT "PortfolioCategory_cardMediaId_fkey"
  FOREIGN KEY ("cardMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PortfolioCategory_status_isActive_displayOrder_idx"
  ON "PortfolioCategory"("status", "isActive", "displayOrder");
