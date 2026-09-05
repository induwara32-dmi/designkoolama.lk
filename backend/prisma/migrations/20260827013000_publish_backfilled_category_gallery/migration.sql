-- Preserve public availability by adding the backfilled direct gallery to existing published category snapshots.
UPDATE "PortfolioCategory" category
SET "publishedSnapshot" = category."publishedSnapshot" || jsonb_build_object(
  'galleryImages', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', gallery."id",
      'displayOrder', gallery."displayOrder",
      'altText', gallery."altText",
      'caption', gallery."caption",
      'media', jsonb_build_object(
        'id', media."id",
        'url', media."url",
        'secureUrl', media."secureUrl",
        'title', media."title",
        'altText', media."altText",
        'caption', media."caption"
      )
    ) ORDER BY gallery."displayOrder")
    FROM "PortfolioCategoryGalleryImage" gallery
    JOIN "MediaAsset" media ON media."id" = gallery."mediaId" AND media."deletedAt" IS NULL
    WHERE gallery."categoryId" = category."id"
  ), '[]'::jsonb)
)
WHERE category."publishedSnapshot" IS NOT NULL;
