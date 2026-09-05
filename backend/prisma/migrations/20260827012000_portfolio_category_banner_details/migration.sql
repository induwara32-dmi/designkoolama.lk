-- Additive banner presentation overrides; existing Media metadata remains unchanged.
ALTER TABLE "PortfolioCategory"
  ADD COLUMN "bannerAltText" TEXT,
  ADD COLUMN "bannerCaption" TEXT;
