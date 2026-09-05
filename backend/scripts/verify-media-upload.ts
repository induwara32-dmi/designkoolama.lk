import { NestFactory } from "@nestjs/core";
import { ContentStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { AppModule } from "../src/app.module";
import { MediaUploadService } from "../src/media/media-upload.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { PublicContentService } from "../src/public-content/public-content.service";
import { PublishingService } from "../src/publishing/publishing.service";

loadEnvFile(resolve(__dirname, "../../.env"));

const required = (name: string) => {
  if (!process.env[name]) throw new Error(`missing:${name}`);
};
const assert = (condition: unknown, step: string) => {
  if (!condition) throw new Error(`verification:${step}`);
};

async function main() {
  ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "CLOUDINARY_FOLDER", "INITIAL_SUPER_ADMIN_EMAIL"].forEach(required);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const uploads = app.get(MediaUploadService);
  const publishing = app.get(PublishingService);
  const publicContent = app.get(PublicContentService);
  const marker = randomBytes(8).toString("hex");
  const slug = `media-verification-${marker}`;
  let assetId: string | undefined;
  let projectId: string | undefined;
  try {
    const adminUser = await prisma.adminUser.findUnique({ where: { email: process.env.INITIAL_SUPER_ADMIN_EMAIL! }, include: { roles: { include: { role: true } } } });
    assert(adminUser, "admin-user");
    const category = await prisma.portfolioCategory.findFirst({ where: { isActive: true }, orderBy: { displayOrder: "asc" } });
    assert(category, "portfolio-category");
    const admin = { id: adminUser!.id, email: adminUser!.email, displayName: adminUser!.displayName, roles: adminUser!.roles.map((entry) => entry.role.name) };
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9V8AAAAASUVORK5CYII=", "base64");
    const file = { fieldname: "file", originalname: "verification.png", encoding: "7bit", mimetype: "image/png", size: buffer.length, buffer, stream: undefined as never, destination: "", filename: "", path: "" };
    const asset = await uploads.upload(file, "Disposable upload verification pixel", "Temporary provider verification asset", admin);
    assetId = asset.id;
    assert(asset.secureUrl.startsWith("https://") && asset.bytes > 0 && Boolean(asset.width) && Boolean(asset.height), "upload-metadata");
    const project = await prisma.portfolioProject.create({ data: { slug, title: "Disposable media verification", summary: "Temporary publishing verification", content: { challenge: "Temporary", solution: "Temporary", outcome: "Temporary" }, categoryId: category!.id, status: ContentStatus.DRAFT, displayOrder: 9999, media: { create: { mediaId: asset.id, displayOrder: 0 } } } });
    projectId = project.id;
    await publishing.publish("portfolio", project.id, admin);
    const published = await publicContent.project(slug) as { media?: Array<{ media?: { id?: string; secureUrl?: string } }> };
    assert(published.media?.[0]?.media?.id === asset.id && published.media[0].media?.secureUrl?.startsWith("https://"), "published-media-snapshot");
    console.log("Live media upload, selection, publishing, and public-read verification passed safely.");
  } finally {
    if (projectId) {
      await prisma.portfolioProject.deleteMany({ where: { id: projectId } });
      await prisma.contentRevision.deleteMany({ where: { resource: "portfolio", entityId: projectId } });
      await prisma.activityLog.deleteMany({ where: { entityType: "portfolio", entityId: projectId } });
    }
    if (assetId) {
      const adminUser = await prisma.adminUser.findUnique({ where: { email: process.env.INITIAL_SUPER_ADMIN_EMAIL! }, include: { roles: { include: { role: true } } } });
      if (adminUser) await uploads.remove(assetId, { id: adminUser.id, email: adminUser.email, displayName: adminUser.displayName, roles: adminUser.roles.map((entry) => entry.role.name) });
      await prisma.activityLog.deleteMany({ where: { entityType: "media", entityId: assetId } });
      await prisma.mediaAsset.deleteMany({ where: { id: assetId } });
    }
    await app.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "verification";
  console.error(message.startsWith("missing:") ? message : "Live media verification failed safely.");
  process.exitCode = 1;
});
