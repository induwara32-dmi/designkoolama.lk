import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ContentStatus,
  MediaKind,
  Prisma,
  SubmissionStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminPrincipal } from "../admin-auth/auth.types";
import type { CmsListQueryDto, CmsResource } from "./admin-cms.dto";

const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const text = (data: Record<string, unknown>, key: string, max = 5000) => {
  const value = data[key];
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new BadRequestException(`${key} is invalid`);
  return value.trim();
};
const optionalText = (
  data: Record<string, unknown>,
  key: string,
  max = 5000,
) => {
  const value = data[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max)
    throw new BadRequestException(`${key} is invalid`);
  return value.trim();
};
const integer = (data: Record<string, unknown>, key: string, fallback = 0) => {
  const value = data[key] ?? fallback;
  if (typeof value !== "number" || !Number.isInteger(value))
    throw new BadRequestException(`${key} is invalid`);
  return value;
};
const boolean = (
  data: Record<string, unknown>,
  key: string,
  fallback = false,
) => {
  const value = data[key] ?? fallback;
  if (typeof value !== "boolean")
    throw new BadRequestException(`${key} is invalid`);
  return value;
};
const optionalDecimal = (
  data: Record<string, unknown>,
  key: string,
  max = 100_000_000,
) => {
  const value = data[key];
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max)
    throw new BadRequestException(`${key} is invalid`);
  return parsed;
};
const slug = (data: Record<string, unknown>) => {
  const value = text(data, "slug", 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    throw new BadRequestException("slug is invalid");
  return value;
};
const object = (data: Record<string, unknown>, key: string) => {
  const value = data[key] ?? {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BadRequestException(`${key} is invalid`);
  return json(value);
};
const seoUpdate = (value: unknown) => {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new BadRequestException("seo is invalid");
  const seo = value as Record<string, unknown>;
  if (Object.keys(seo).length === 0) return {};
  const create = {
    title: text(seo, "title", 300),
    description: text(seo, "description", 500),
    canonicalUrl: optionalText(seo, "canonicalUrl", 2000),
    openGraph:
      seo.openGraph &&
      typeof seo.openGraph === "object" &&
      !Array.isArray(seo.openGraph)
        ? json(seo.openGraph)
        : undefined,
  };
  return { seo: { upsert: { create, update: create } } };
};
const approvedIcons = new Set([
  "facebook",
  "instagram",
  "linkedin",
  "behance",
  "mail",
  "phone",
  "clock",
  "map-pin",
  "flame",
  "pen-tool",
  "share",
  "monitor",
  "box",
  "layers",
  "calendar",
  "globe",
  "flag",
  "brush",
  "shield",
  "lightbulb",
  "trophy",
  "check",
  "eye",
]);
const validateStructuredContent = (value: unknown, depth = 0): void => {
  if (depth > 8)
    throw new BadRequestException("Structured content is too deeply nested");
  if (typeof value === "string") {
    if (value.length > 5000)
      throw new BadRequestException("Structured content text is too long");
    return;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null)
    return;
  if (Array.isArray(value)) {
    if (value.length > 100)
      throw new BadRequestException(
        "Structured content contains too many items",
      );
    value.forEach((item) => validateStructuredContent(item, depth + 1));
    return;
  }
  if (!value || typeof value !== "object")
    throw new BadRequestException(
      "Structured content contains an unsupported value",
    );
  for (const [key, item] of Object.entries(value)) {
    if (/^(html|css|javascript|script|source|environment|env)$/i.test(key))
      throw new BadRequestException(`${key} is not editable`);
    if (key === "iconKey" && !approvedIcons.has(String(item)))
      throw new BadRequestException("iconKey is not approved");
    if (
      /(href|url)$/i.test(key) &&
      typeof item === "string" &&
      item !== "" &&
      !/^(\/|#|mailto:|tel:|https:\/\/)/i.test(item)
    )
      throw new BadRequestException(`${key} is not a safe link`);
    validateStructuredContent(item, depth + 1);
  }
};
const preservePublished = (value: unknown) => {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  if (row.status !== ContentStatus.PUBLISHED || row.publishedSnapshot)
    return undefined;
  const {
    id: discardedId,
    status: discardedStatus,
    publishedSnapshot: discardedSnapshot,
    createdAt,
    updatedAt,
    deletedAt,
    publishedAt,
    ...snapshot
  } = row;
  void discardedId;
  void discardedStatus;
  void discardedSnapshot;
  void createdAt;
  void updatedAt;
  void deletedAt;
  void publishedAt;
  return json(snapshot);
};

@Injectable()
export class AdminCmsService {
  constructor(private readonly prisma: PrismaService) {}
  private async categoryMedia(data: Record<string, unknown>) {
    const cardMediaId = optionalText(data, "cardMediaId", 50);
    const bannerMediaId = optionalText(data, "bannerMediaId", 50);
    const galleryImages = Array.isArray(data.galleryImages) ? data.galleryImages.slice(0,100).map((item,index)=>{
      if(!item||typeof item!=="object") throw new BadRequestException("Gallery images are invalid.");
      const row=item as Record<string,unknown>,mediaId=typeof row.mediaId==="string"?row.mediaId.trim():"";
      if(!mediaId) throw new BadRequestException("Gallery image is invalid.");
      return {mediaId,altText:optionalText(row,"altText",500),caption:optionalText(row,"caption",1000),displayOrder:index};
    }):[];
    if(new Set(galleryImages.map(item=>item.mediaId)).size!==galleryImages.length) throw new BadRequestException("A gallery image can only be added once.");
    const ids = [cardMediaId, bannerMediaId,...galleryImages.map(item=>item.mediaId)].filter((id): id is string => Boolean(id));
    if (ids.length) {
      const count = await this.prisma.mediaAsset.count({where:{id:{in:[...new Set(ids)]},deletedAt:null,kind:MediaKind.IMAGE}});
      if(count!==new Set(ids).size) throw new BadRequestException("Select valid category images from the Media Library.");
    }
    return {cardMediaId,bannerMediaId,galleryImages};
  }
  private async portfolioRelations(data: Record<string, unknown>) {
    const categoryId = text(data, "categoryId", 50);
    const serviceId = optionalText(data, "serviceId", 50);
    const mediaIds = Array.isArray(data.mediaIds)
      ? [...new Set(data.mediaIds.map((value) => String(value).trim()))]
          .filter(Boolean)
          .slice(0, 20)
      : [];
    if (!mediaIds.length)
      throw new BadRequestException("Select at least one project image.");
    const [category, relatedService, selectedMedia] = await Promise.all([
      this.prisma.portfolioCategory.findFirst({
        where: { id: categoryId, isActive: true },
        select: { id: true },
      }),
      serviceId
        ? this.prisma.service.findFirst({
            where: { id: serviceId, deletedAt: null },
            select: { id: true },
          })
        : Promise.resolve(null),
      this.prisma.mediaAsset.findMany({
        where: { id: { in: mediaIds }, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!category)
      throw new BadRequestException(
        "Select a valid portfolio category before saving.",
      );
    if (serviceId && !relatedService)
      throw new BadRequestException(
        "The selected related service is unavailable.",
      );
    if (selectedMedia.length !== mediaIds.length)
      throw new BadRequestException(
        "One or more selected images are unavailable. Please choose images from the Media Library.",
      );
    return { categoryId, serviceId, mediaIds };
  }
  private rethrowPortfolioCreateError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new ConflictException(
          "This project URL already exists. Please choose another slug.",
        );
      if (error.code === "P2003")
        throw new BadRequestException(
          "A selected category, service, or image is no longer available.",
        );
    }
    throw error;
  }
  private async ensurePackageCategory(categoryId: string) {
    const category = await this.prisma.packageCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category)
      throw new BadRequestException("Select a valid package category before saving.");
  }
  // "Most popular" is exclusive within a category: enabling it on one package
  // must unset it on every sibling package in the same category.
  private async clearOtherPopularPackages(
    tx: Prisma.TransactionClient,
    categoryId: string,
    keepId?: string,
  ) {
    await tx.package.updateMany({
      where: {
        categoryId,
        isPopular: true,
        ...(keepId ? { id: { not: keepId } } : {}),
      },
      data: { isPopular: false },
    });
  }
  private rethrowPackageMutationError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new ConflictException(
          "This package URL already exists. Please choose another slug.",
        );
      if (error.code === "P2003")
        throw new BadRequestException(
          "The selected package category is no longer available.",
        );
    }
    throw error;
  }
  async audit(
    admin: AdminPrincipal,
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown,
  ) {
    await this.prisma.activityLog.create({
      data: {
        actorId: admin.id,
        action,
        entityType,
        entityId,
        before: before ? json(before) : undefined,
        after: after ? json(after) : undefined,
      },
    });
  }
  list(resource: CmsResource, query: CmsListQueryDto) {
    const search = query.search?.trim();
    switch (resource) {
      case "pages":
        return this.prisma.page.findMany({
          where: {
            deletedAt: null,
            ...(query.status ? { status: query.status as ContentStatus } : {}),
            ...(search
              ? {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { updatedAt: "desc" },
          include: {
            sections: { orderBy: { displayOrder: "asc" } },
            seo: true,
          },
        });
      case "services":
        return this.prisma.service.findMany({
          where: {
            deletedAt: null,
            ...(query.status ? { status: query.status as ContentStatus } : {}),
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { slug: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { displayOrder: "asc" },
          include: { seo: true },
        });
      case "portfolio-categories":
        // Removed categories are soft-deleted (isActive: false); without this filter
        // they would keep reappearing in the admin list on every reload even though
        // the Remove action already succeeded (matches package-categories below).
        return this.prisma.portfolioCategory.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: { cardMedia: true, bannerMedia: true, galleryImages:{orderBy:{displayOrder:"asc"},include:{media:true}}, _count: { select: { projects: true } } },
        });
      case "portfolio":
        return this.prisma.portfolioProject.findMany({
          where: {
            deletedAt: null,
            ...(query.status ? { status: query.status as ContentStatus } : {}),
            ...(search
              ? { title: { contains: search, mode: "insensitive" } }
              : {}),
          },
          orderBy: { displayOrder: "asc" },
          include: {
            category: true,
            service: true,
            media: { include: { media: true } },
            seo: true,
          },
        });
      case "package-categories":
        // Removed categories are soft-deleted (isActive: false); without this filter
        // they would keep reappearing in the admin list on every reload even though
        // the Remove action already succeeded.
        return this.prisma.packageCategory.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: { _count: { select: { packages: true } } },
        });
      case "packages":
        return this.prisma.package.findMany({
          where: {
            status: query.status
              ? (query.status as ContentStatus)
              : { not: ContentStatus.ARCHIVED },
            ...(search
              ? { name: { contains: search, mode: "insensitive" } }
              : {}),
          },
          orderBy: { displayOrder: "asc" },
          include: {
            category: true,
            features: { orderBy: { displayOrder: "asc" } },
          },
        });
      case "testimonials":
        return this.prisma.testimonial.findMany({
          where: {
            // Archived normally means fully gone, but older rows archived before
            // `remove()` cleared publishedSnapshot can still be live on the public
            // site (see the OR clause in PublicContentService.testimonials()) --
            // keep those visible here too so an admin can actually find and fix them.
            ...(query.status
              ? { status: query.status as ContentStatus }
              : {
                  OR: [
                    { status: { not: ContentStatus.ARCHIVED } },
                    { publishedSnapshot: { not: Prisma.DbNull } },
                  ],
                }),
            ...(search
              ? { clientName: { contains: search, mode: "insensitive" } }
              : {}),
          },
          orderBy: { displayOrder: "asc" },
          include: { avatar: true },
        });
      case "media":
        return this.prisma.mediaAsset.findMany({
          where: {
            deletedAt: null,
            ...(search
              ? {
                  OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { altText: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
        });
      case "settings":
        return this.prisma.siteSetting.findMany({
          where: {
            ...(search
              ? { key: { contains: search, mode: "insensitive" } }
              : {}),
          },
          orderBy: { key: "asc" },
        });
      case "quotes":
        return this.prisma.quoteRequest.findMany({
          where: {
            ...(query.status
              ? { status: query.status as SubmissionStatus }
              : {}),
            ...(search
              ? {
                  OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          include: { service: true, package: true },
        });
      case "contacts":
        return this.prisma.contactMessage.findMany({
          where: {
            ...(query.status
              ? { status: query.status as SubmissionStatus }
              : {}),
            ...(search
              ? {
                  OR: [
                    { fullName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { subject: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
        });
      case "activity":
        return this.prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 200,
          include: { actor: { select: { displayName: true, email: true } } },
        });
    }
  }
  async create(
    resource: CmsResource,
    data: Record<string, unknown>,
    admin: AdminPrincipal,
  ) {
    let created: unknown;
    switch (resource) {
      case "pages":
        created = await this.prisma.page.create({
          data: {
            slug: slug(data),
            title: text(data, "title", 200),
            status: ContentStatus.DRAFT,
          },
        });
        break;
      case "services": {
        const content = object(data, "content");
        validateStructuredContent(content);
        created = await this.prisma.service.create({
          data: {
            slug: slug(data),
            name: text(data, "name", 200),
            summary: text(data, "summary"),
            content,
            status: ContentStatus.DRAFT,
            displayOrder: integer(data, "displayOrder"),
          },
        });
        break;
      }
      case "portfolio-categories": {
        const iconKey = optionalText(data, "iconKey", 100);
        if (iconKey && !approvedIcons.has(iconKey))
          throw new BadRequestException("iconKey is not approved");
        const {cardMediaId,bannerMediaId,galleryImages}=await this.categoryMedia(data);
        created = await this.prisma.portfolioCategory.create({
          data: {
            slug: slug(data),
            name: text(data, "name", 200),
            cardTitle: optionalText(data, "cardTitle", 300),
            description: optionalText(data, "description", 1000),
            shortDescription: optionalText(data, "shortDescription", 1000),
            overview: optionalText(data, "overview", 5000),
            iconKey,
            cardMediaId,
            bannerMediaId,
            bannerAltText: optionalText(data,"bannerAltText",500),
            bannerCaption: optionalText(data,"bannerCaption",1000),
            galleryImages:{create:galleryImages},
            displayOrder: integer(data, "displayOrder"),
            isActive: boolean(data, "isActive", true),
            status: ContentStatus.DRAFT,
          },
          include: { cardMedia: true, bannerMedia: true, galleryImages:{orderBy:{displayOrder:"asc"},include:{media:true}} },
        });
        break;
      }
      case "portfolio": {
        const content = object(data, "content");
        validateStructuredContent(content);
        const { categoryId, serviceId, mediaIds } =
          await this.portfolioRelations(data);
        try {
          created = await this.prisma.portfolioProject.create({
            data: {
              slug: slug(data),
              title: text(data, "title", 200),
              clientName: optionalText(data, "clientName", 200),
              summary: text(data, "summary"),
              content,
              categoryId,
              serviceId,
              status: ContentStatus.DRAFT,
              displayOrder: integer(data, "displayOrder"),
              media: {
                create: mediaIds.map((mediaId, index) => ({
                  mediaId,
                  displayOrder: index,
                })),
              },
            },
            include: {
              category: true,
              service: true,
              media: { include: { media: true } },
              seo: true,
            },
          });
        } catch (error) {
          this.rethrowPortfolioCreateError(error);
        }
        break;
      }
      case "package-categories": {
        const content = object(data, "content");
        validateStructuredContent(content);
        created = await this.prisma.packageCategory.create({
          data: {
            slug: slug(data),
            name: text(data, "name", 200),
            headline: optionalText(data, "headline", 300),
            description: optionalText(data, "description"),
            content,
            displayOrder: integer(data, "displayOrder"),
            isActive: boolean(data, "isActive", true),
          },
        });
        break;
      }
      case "packages": {
        const categoryId = text(data, "categoryId", 50);
        await this.ensurePackageCategory(categoryId);
        const isPopular = boolean(data, "isPopular");
        try {
          created = await this.prisma.$transaction(async (tx) => {
            if (isPopular) await this.clearOtherPopularPackages(tx, categoryId);
            return tx.package.create({
              data: {
                slug: slug(data),
                categoryId,
                name: text(data, "name", 200),
                subtitle: optionalText(data, "subtitle", 300),
                description: optionalText(data, "description"),
                price: optionalDecimal(data, "price"),
                priceLabel: optionalText(data, "priceLabel", 100),
                currency: optionalText(data, "currency", 10) ?? "LKR",
                ctaLabel: optionalText(data, "ctaLabel", 100),
                isPopular,
                isActive: boolean(data, "isActive", true),
                status: ContentStatus.DRAFT,
                displayOrder: integer(data, "displayOrder"),
                features: {
                  create: Array.isArray(data.features)
                    ? data.features.map((label, index) => ({
                        label: String(label).slice(0, 300),
                        displayOrder: index,
                      }))
                    : [],
                },
              },
              include: { category: true, features: { orderBy: { displayOrder: "asc" } } },
            });
          });
        } catch (error) {
          this.rethrowPackageMutationError(error);
        }
        break;
      }
      case "testimonials":
        created = await this.prisma.testimonial.create({
          data: {
            clientName: text(data, "clientName", 200),
            clientRole: optionalText(data, "clientRole", 200),
            company: optionalText(data, "company", 200),
            quote: text(data, "quote"),
            rating: integer(data, "rating", 5),
            status: ContentStatus.DRAFT,
            displayOrder: integer(data, "displayOrder"),
            avatarId: optionalText(data, "avatarId", 50),
          },
        });
        break;
      case "media": {
        const url = text(data, "url", 2000);
        if (!/^https:\/\//i.test(url))
          throw new BadRequestException("Only HTTPS media URLs are allowed");
        created = await this.prisma.mediaAsset.create({
          data: {
            providerId: text(data, "providerId", 300),
            kind: (data.kind as MediaKind) ?? MediaKind.IMAGE,
            url,
            secureUrl: url,
            title: text(data, "title", 300),
            altText: text(data, "altText", 500),
            caption: optionalText(data, "caption", 1000),
            folder: optionalText(data, "folder", 300),
            mimeType: text(data, "mimeType", 100),
            bytes: integer(data, "bytes"),
          },
        });
        break;
      }
      case "settings":
        created = await this.prisma.siteSetting.create({
          data: {
            key: text(data, "key", 200),
            value: object(data, "value"),
            isPublic: boolean(data, "isPublic"),
          },
        });
        break;
      default:
        throw new BadRequestException("Resource cannot be created");
    }
    await this.audit(
      admin,
      "CMS_CREATE",
      resource,
      (created as { id?: string }).id ?? "",
      null,
      created,
    );
    return created;
  }
  async update(
    resource: CmsResource,
    id: string,
    data: Record<string, unknown>,
    admin: AdminPrincipal,
  ) {
    let before: unknown, after: unknown;
    switch (resource) {
      case "pages": {
        before = await this.prisma.page.findUnique({
          where: { id },
          include: {
            sections: { orderBy: { displayOrder: "asc" } },
            seo: true,
          },
        });
        const sections = Array.isArray(data.sections)
          ? data.sections.map((item, index) => {
              const row = item as Record<string, unknown>,
                content = object(row, "content");
              validateStructuredContent(content);
              return {
                key: text(row, "key", 100),
                kind: text(row, "kind", 100),
                content,
                displayOrder: index,
                isEnabled: boolean(row, "isEnabled", true),
              };
            })
          : undefined;
        after = await this.prisma.page.update({
          where: { id },
          data: {
            status: ContentStatus.DRAFT,
            publishedSnapshot: preservePublished(before),
            ...(data.title !== undefined
              ? { title: text(data, "title", 200) }
              : {}),
            ...(sections
              ? { sections: { deleteMany: {}, create: sections } }
              : {}),
            ...seoUpdate(data.seo),
          },
          include: { sections: true, seo: true },
        });
        break;
      }
      case "services":
        before = await this.prisma.service.findUnique({
          where: { id },
          include: { seo: true },
        });
        after = await this.prisma.service.update({
          where: { id },
          data: {
            status: ContentStatus.DRAFT,
            publishedSnapshot: preservePublished(before),
            ...(data.name !== undefined
              ? { name: text(data, "name", 200) }
              : {}),
            ...(data.summary !== undefined
              ? { summary: text(data, "summary") }
              : {}),
            ...(data.content !== undefined
              ? { content: object(data, "content") }
              : {}),
            ...(data.displayOrder !== undefined
              ? { displayOrder: integer(data, "displayOrder") }
              : {}),
            ...seoUpdate(data.seo),
          },
        });
        break;
      case "portfolio-categories": {
        before = await this.prisma.portfolioCategory.findUnique({
          where: { id },
          include: { cardMedia: true, bannerMedia: true, galleryImages:{orderBy:{displayOrder:"asc"},include:{media:true}} },
        });
        const iconKey =
          data.iconKey !== undefined
            ? optionalText(data, "iconKey", 100)
            : undefined;
        if (iconKey && !approvedIcons.has(iconKey))
          throw new BadRequestException("iconKey is not approved");
        const categoryMedia = await this.categoryMedia({
          cardMediaId: data.cardMediaId ?? (before as {cardMediaId?:unknown})?.cardMediaId,
          bannerMediaId: data.bannerMediaId ?? (before as {bannerMediaId?:unknown})?.bannerMediaId,
          galleryImages: data.galleryImages ?? (before as {galleryImages?:unknown})?.galleryImages,
        });
        after = await this.prisma.portfolioCategory.update({
          where: { id },
          data: {
            status: ContentStatus.DRAFT,
            publishedSnapshot: preservePublished(before),
            ...(data.slug !== undefined ? { slug: slug(data) } : {}),
            ...(data.name !== undefined
              ? { name: text(data, "name", 200) }
              : {}),
            ...(data.cardTitle !== undefined
              ? { cardTitle: optionalText(data, "cardTitle", 300) }
              : {}),
            ...(data.description !== undefined
              ? { description: optionalText(data, "description", 1000) }
              : {}),
            ...(data.shortDescription !== undefined
              ? { shortDescription: optionalText(data, "shortDescription", 1000) }
              : {}),
            ...(data.overview !== undefined
              ? { overview: optionalText(data, "overview", 5000) }
              : {}),
            ...(data.iconKey !== undefined ? { iconKey } : {}),
            ...(data.cardMediaId !== undefined
              ? { cardMediaId: categoryMedia.cardMediaId }
              : {}),
            ...(data.bannerMediaId !== undefined
              ? { bannerMediaId: categoryMedia.bannerMediaId }
              : {}),
            ...(data.bannerAltText!==undefined?{bannerAltText:optionalText(data,"bannerAltText",500)}:{}),
            ...(data.bannerCaption!==undefined?{bannerCaption:optionalText(data,"bannerCaption",1000)}:{}),
            ...(data.galleryImages !== undefined ? {galleryImages:{deleteMany:{},create:categoryMedia.galleryImages}} : {}),
            ...(data.displayOrder !== undefined
              ? { displayOrder: integer(data, "displayOrder") }
              : {}),
            ...(data.isActive !== undefined
              ? { isActive: boolean(data, "isActive") }
              : {}),
          },
          include: { cardMedia: true, bannerMedia: true, galleryImages:{orderBy:{displayOrder:"asc"},include:{media:true}} },
        });
        break;
      }
      case "portfolio":
        before = await this.prisma.portfolioProject.findUnique({
          where: { id },
          include: { category: true, service: true, seo: true, media: true },
        });
        after = await this.prisma.portfolioProject.update({
          where: { id },
          data: {
            status: ContentStatus.DRAFT,
            publishedSnapshot: preservePublished(before),
            ...(data.slug !== undefined ? { slug: slug(data) } : {}),
            ...(data.title !== undefined
              ? { title: text(data, "title", 200) }
              : {}),
            ...(data.categoryId !== undefined
              ? { categoryId: text(data, "categoryId", 50) }
              : {}),
            ...(data.serviceId !== undefined
              ? { serviceId: optionalText(data, "serviceId", 50) }
              : {}),
            ...(data.clientName !== undefined
              ? { clientName: optionalText(data, "clientName", 200) }
              : {}),
            ...(data.summary !== undefined
              ? { summary: text(data, "summary") }
              : {}),
            ...(data.content !== undefined
              ? { content: object(data, "content") }
              : {}),
            ...(data.displayOrder !== undefined
              ? { displayOrder: integer(data, "displayOrder") }
              : {}),
            ...(Array.isArray(data.mediaIds)
              ? {
                  media: {
                    deleteMany: {},
                    create: data.mediaIds
                      .slice(0, 20)
                      .map((mediaId, index) => ({
                        mediaId: String(mediaId),
                        displayOrder: index,
                      })),
                  },
                }
              : {}),
            ...seoUpdate(data.seo),
          },
          include: {
            category: true,
            service: true,
            media: { include: { media: true } },
            seo: true,
          },
        });
        break;
      case "package-categories":
        before = await this.prisma.packageCategory.findUnique({
          where: { id },
        });
        after = await this.prisma.packageCategory.update({
          where: { id },
          data: {
            ...(data.name !== undefined
              ? { name: text(data, "name", 200) }
              : {}),
            ...(data.headline !== undefined
              ? { headline: optionalText(data, "headline", 300) }
              : {}),
            ...(data.description !== undefined
              ? { description: optionalText(data, "description") }
              : {}),
            ...(data.content !== undefined
              ? { content: object(data, "content") }
              : {}),
            ...(data.displayOrder !== undefined
              ? { displayOrder: integer(data, "displayOrder") }
              : {}),
            ...(data.isActive !== undefined
              ? { isActive: boolean(data, "isActive") }
              : {}),
          },
        });
        break;
      case "packages": {
        before = await this.prisma.package.findUnique({
          where: { id },
          include: {
            category: true,
            features: { orderBy: { displayOrder: "asc" } },
          },
        });
        if (!before) throw new NotFoundException("Package not found");
        const existingCategoryId = (before as { categoryId: string }).categoryId;
        const nextCategoryId =
          data.categoryId !== undefined ? text(data, "categoryId", 50) : existingCategoryId;
        if (data.categoryId !== undefined) await this.ensurePackageCategory(nextCategoryId);
        const nextIsPopular =
          data.isPopular !== undefined ? boolean(data, "isPopular") : undefined;
        try {
          after = await this.prisma.$transaction(async (tx) => {
            if (nextIsPopular) await this.clearOtherPopularPackages(tx, nextCategoryId, id);
            return tx.package.update({
              where: { id },
              data: {
                status: ContentStatus.DRAFT,
                publishedSnapshot: preservePublished(before),
                ...(data.categoryId !== undefined ? { categoryId: nextCategoryId } : {}),
                ...(data.name !== undefined
                  ? { name: text(data, "name", 200) }
                  : {}),
                ...(data.subtitle !== undefined
                  ? { subtitle: optionalText(data, "subtitle", 300) }
                  : {}),
                ...(data.description !== undefined
                  ? { description: optionalText(data, "description") }
                  : {}),
                ...(data.price !== undefined
                  ? { price: optionalDecimal(data, "price") }
                  : {}),
                ...(data.priceLabel !== undefined
                  ? { priceLabel: optionalText(data, "priceLabel", 100) }
                  : {}),
                ...(data.currency !== undefined
                  ? { currency: optionalText(data, "currency", 10) ?? "LKR" }
                  : {}),
                ...(data.ctaLabel !== undefined
                  ? { ctaLabel: optionalText(data, "ctaLabel", 100) }
                  : {}),
                ...(nextIsPopular !== undefined ? { isPopular: nextIsPopular } : {}),
                ...(data.displayOrder !== undefined
                  ? { displayOrder: integer(data, "displayOrder") }
                  : {}),
                ...(data.isActive !== undefined
                  ? { isActive: boolean(data, "isActive") }
                  : {}),
                ...(data.features !== undefined && Array.isArray(data.features)
                  ? {
                      features: {
                        deleteMany: {},
                        create: data.features.map((label, index) => ({
                          label: String(label).slice(0, 300),
                          displayOrder: index,
                        })),
                      },
                    }
                  : {}),
              },
              include: { category: true, features: { orderBy: { displayOrder: "asc" } } },
            });
          });
        } catch (error) {
          this.rethrowPackageMutationError(error);
        }
        break;
      }
      case "testimonials":
        before = await this.prisma.testimonial.findUnique({ where: { id } });
        after = await this.prisma.testimonial.update({
          where: { id },
          data: {
            status: ContentStatus.DRAFT,
            publishedSnapshot: preservePublished(before),
            ...(data.clientName !== undefined
              ? { clientName: text(data, "clientName", 200) }
              : {}),
            ...(data.clientRole !== undefined
              ? { clientRole: optionalText(data, "clientRole", 200) }
              : {}),
            ...(data.company !== undefined
              ? { company: optionalText(data, "company", 200) }
              : {}),
            ...(data.quote !== undefined ? { quote: text(data, "quote") } : {}),
            ...(data.rating !== undefined
              ? { rating: integer(data, "rating", 5) }
              : {}),
            ...(data.displayOrder !== undefined
              ? { displayOrder: integer(data, "displayOrder") }
              : {}),
            ...(data.avatarId !== undefined
              ? { avatarId: optionalText(data, "avatarId", 50) }
              : {}),
          },
        });
        break;
      case "media": {
        before = await this.prisma.mediaAsset.findUnique({ where: { id } });
        if (
          data.url !== undefined &&
          !/^https:\/\//i.test(text(data, "url", 2000))
        )
          throw new BadRequestException("Only HTTPS media URLs are allowed");
        after = await this.prisma.mediaAsset.update({
          where: { id },
          data: {
            ...(data.url !== undefined
              ? {
                  url: text(data, "url", 2000),
                  secureUrl: text(data, "url", 2000),
                }
              : {}),
            ...(data.title !== undefined
              ? { title: text(data, "title", 300) }
              : {}),
            ...(data.altText !== undefined
              ? { altText: text(data, "altText", 500) }
              : {}),
            ...(data.caption !== undefined
              ? { caption: optionalText(data, "caption", 1000) }
              : {}),
            ...(data.folder !== undefined
              ? { folder: optionalText(data, "folder", 300) }
              : {}),
          },
        });
        break;
      }
      case "settings":
        before = await this.prisma.siteSetting.findUnique({ where: { id } });
        after = await this.prisma.siteSetting.update({
          where: { id },
          data: {
            ...(data.value !== undefined
              ? { value: object(data, "value") }
              : {}),
            ...(data.isPublic !== undefined
              ? { isPublic: boolean(data, "isPublic") }
              : {}),
          },
        });
        break;
      default:
        throw new BadRequestException("Resource cannot be updated");
    }
    if (!before) throw new NotFoundException("Record not found");
    await this.audit(admin, "CMS_UPDATE", resource, id, before, after);
    return after;
  }
  async updateSubmission(
    resource: "quotes" | "contacts",
    id: string,
    status: SubmissionStatus,
    admin: AdminPrincipal,
  ) {
    const before =
      resource === "quotes"
        ? await this.prisma.quoteRequest.findUnique({ where: { id } })
        : await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Submission not found");
    const after =
      resource === "quotes"
        ? await this.prisma.quoteRequest.update({
            where: { id },
            data: { status },
          })
        : await this.prisma.contactMessage.update({
            where: { id },
            data: { status },
          });
    await this.audit(admin, "SUBMISSION_STATUS", resource, id, before, after);
    return after;
  }
  async remove(resource: CmsResource, id: string, admin: AdminPrincipal) {
    let before: unknown;
    switch (resource) {
      case "pages":
        before = await this.prisma.page.update({
          where: { id },
          data: { deletedAt: new Date(), status: "ARCHIVED" },
        });
        break;
      case "services":
        before = await this.prisma.service.update({
          where: { id },
          data: { deletedAt: new Date(), status: "ARCHIVED" },
        });
        break;
      case "portfolio":
        before = await this.prisma.portfolioProject.update({
          where: { id },
          data: { deletedAt: new Date(), status: "ARCHIVED" },
        });
        break;
      case "portfolio-categories": {
        // Projects are themselves soft-deleted (archived), so an archived project
        // must not keep blocking category removal forever -- only count projects
        // the admin hasn't already removed (matches package-categories below).
        const projectCount = await this.prisma.portfolioProject.count({
          where: { categoryId: id, status: { not: ContentStatus.ARCHIVED } },
        });
        if (projectCount > 0)
          throw new ConflictException(
            `This category still has ${projectCount} portfolio project${projectCount === 1 ? "" : "s"}. Remove or reassign ${projectCount === 1 ? "it" : "them"} before removing the category.`,
          );
        before = await this.prisma.portfolioCategory.update({
          where: { id },
          data: {
            isActive: false,
            status: ContentStatus.ARCHIVED,
            publishedSnapshot: Prisma.DbNull,
            publishedAt: null,
          },
        });
        break;
      }
      case "package-categories": {
        // Removing a package only archives it (soft-delete, matching every other
        // resource here), so an archived package must not keep blocking category
        // removal forever -- only count packages the admin hasn't already removed.
        const packageCount = await this.prisma.package.count({
          where: { categoryId: id, status: { not: ContentStatus.ARCHIVED } },
        });
        if (packageCount > 0)
          throw new ConflictException(
            `This category still has ${packageCount} package${packageCount === 1 ? "" : "s"}. Remove or reassign ${packageCount === 1 ? "it" : "them"} before removing the category.`,
          );
        before = await this.prisma.packageCategory.update({
          where: { id },
          data: { isActive: false },
        });
        break;
      }
      case "packages":
        before = await this.prisma.package.update({
          where: { id },
          data: {
            isActive: false,
            status: ContentStatus.ARCHIVED,
            publishedSnapshot: Prisma.DbNull,
          },
        });
        break;
      case "testimonials":
        before = await this.prisma.testimonial.update({
          where: { id },
          data: { status: ContentStatus.ARCHIVED, publishedSnapshot: Prisma.DbNull },
        });
        break;
      case "media": {
        const used = await this.prisma.mediaAsset.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                portfolioUses: true,
                categoryCardUses: true,
                testimonialUses: true,
                quoteAttachments: true,
              },
            },
          },
        });
        if (!used) throw new NotFoundException("Media not found");
        if (Object.values(used._count).some(Boolean))
          throw new ConflictException("Media is still referenced");
        before = await this.prisma.mediaAsset.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        break;
      }
      default:
        throw new BadRequestException("Resource cannot be removed");
    }
    await this.audit(admin, "CMS_ARCHIVE", resource, id, before, null);
    return { archived: true };
  }
}
