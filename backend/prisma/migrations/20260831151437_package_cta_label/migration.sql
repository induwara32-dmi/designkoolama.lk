-- AlterTable
ALTER TABLE "ContentRevision" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "ctaLabel" TEXT;
