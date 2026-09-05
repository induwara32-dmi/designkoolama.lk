import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminPrincipal } from "../admin-auth/auth.types";
import { CloudinaryMediaProvider } from "./cloudinary-media.provider";
import { validateImageFile } from "./image-file-validation";

@Injectable()
export class MediaUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly provider: CloudinaryMediaProvider,
  ) {}
  async upload(
    file: Express.Multer.File | undefined,
    altText: string | undefined,
    caption: string | undefined,
    admin: AdminPrincipal,
  ) {
    const alt = altText?.trim();
    if (!alt || alt.length > 500)
      throw new BadRequestException(
        "Alternative text is required and must be 500 characters or fewer",
      );
    if (caption && caption.length > 1000)
      throw new BadRequestException("Caption must be 1000 characters or fewer");
    const maxMb = this.config.get<number>("MEDIA_MAX_FILE_SIZE_MB", 10),
      validated = validateImageFile(file, maxMb * 1024 * 1024);
    const uploaded = await this.provider.upload(file!.buffer);
    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          providerId: uploaded.providerId,
          kind: "IMAGE",
          url: uploaded.secureUrl,
          secureUrl: uploaded.secureUrl,
          title: validated.displayName,
          altText: alt,
          caption: caption?.trim() || null,
          folder: this.config.get<string>("CLOUDINARY_FOLDER"),
          mimeType: validated.mimeType,
          bytes: uploaded.bytes || file!.size,
          width: uploaded.width,
          height: uploaded.height,
        },
      });
      await this.prisma.activityLog.create({
        data: {
          actorId: admin.id,
          action: "MEDIA_UPLOAD",
          entityType: "media",
          entityId: asset.id,
          after: {
            id: asset.id,
            providerId: asset.providerId,
            mimeType: asset.mimeType,
            bytes: asset.bytes,
            width: asset.width,
            height: asset.height,
          },
        },
      });
      return asset;
    } catch (error) {
      await this.provider.remove(uploaded.providerId).catch(() => undefined);
      throw error;
    }
  }
  async remove(id: string, admin: AdminPrincipal) {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            portfolioUses: true,
            categoryCardUses: true,
            categoryBannerUses: true,
            categoryGalleryUses: true,
            testimonialUses: true,
            quoteAttachments: true,
          },
        },
      },
    });
    if (!asset) throw new NotFoundException("Media asset was not found");
    if (Object.values(asset._count).some(Boolean))
      throw new ConflictException("Media is still referenced");
    const folder = this.config.get<string>("CLOUDINARY_FOLDER");
    if (
      folder &&
      asset.folder === folder &&
      asset.providerId.startsWith(`${folder}/`)
    )
      await this.provider.remove(asset.providerId);
    const archived = await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.prisma.activityLog.create({
      data: {
        actorId: admin.id,
        action: "MEDIA_DELETE",
        entityType: "media",
        entityId: id,
        before: { id: asset.id, providerId: asset.providerId },
      },
    });
    return { archived: Boolean(archived.deletedAt) };
  }
}
