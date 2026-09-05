-- Non-destructive one-time compatibility backfill from existing published project media.
INSERT INTO "PortfolioCategoryGalleryImage" ("id", "categoryId", "mediaId", "altText", "caption", "displayOrder", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  project."categoryId",
  project_media."mediaId",
  NULL,
  media."caption",
  ROW_NUMBER() OVER (PARTITION BY project."categoryId" ORDER BY project."displayOrder", project."createdAt", project_media."displayOrder") - 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "PortfolioProject" project
JOIN "PortfolioMedia" project_media ON project_media."projectId" = project."id"
JOIN "MediaAsset" media ON media."id" = project_media."mediaId" AND media."deletedAt" IS NULL
WHERE project."deletedAt" IS NULL
  AND (project."status" = 'PUBLISHED' OR project."publishedSnapshot" IS NOT NULL)
ON CONFLICT ("categoryId", "mediaId") DO NOTHING;
