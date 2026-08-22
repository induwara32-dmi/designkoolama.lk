-- Phase 8 publishing is additive: no existing column or row is dropped or rewritten.
ALTER TABLE "Page" ADD COLUMN "publishedSnapshot" JSONB;
ALTER TABLE "Service" ADD COLUMN "publishedSnapshot" JSONB;
ALTER TABLE "PortfolioProject" ADD COLUMN "publishedSnapshot" JSONB;
ALTER TABLE "Package" ADD COLUMN "publishedSnapshot" JSONB;
ALTER TABLE "Testimonial" ADD COLUMN "publishedSnapshot" JSONB;

CREATE TABLE "ContentRevision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdById" UUID,
    "publishedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContentRevision_resource_entityId_version_key" ON "ContentRevision"("resource", "entityId", "version");
CREATE INDEX "ContentRevision_resource_entityId_publishedAt_idx" ON "ContentRevision"("resource", "entityId", "publishedAt");
CREATE INDEX "ContentRevision_createdById_createdAt_idx" ON "ContentRevision"("createdById", "createdAt");
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
