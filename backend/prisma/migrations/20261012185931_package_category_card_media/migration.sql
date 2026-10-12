-- AlterTable
ALTER TABLE "PackageCategory" ADD COLUMN     "cardMediaId" UUID;

-- AddForeignKey
ALTER TABLE "PackageCategory" ADD CONSTRAINT "PackageCategory_cardMediaId_fkey" FOREIGN KEY ("cardMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
