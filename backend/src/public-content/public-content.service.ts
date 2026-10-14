import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, MediaKind, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { LatestImagesQueryDto, PackageQueryDto, PortfolioQueryDto } from "./public-content.dto";
import { publishedField, publishedServiceField, visibleCategoryWhere, visibleServiceWhere } from "./published-service";
const stringValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
const featureLabel = (value: unknown) =>
  value &&
  typeof value === "object" &&
  "label" in value &&
  typeof (value as { label?: unknown }).label === "string"
    ? (value as { label: string }).label
    : stringValue(value);
@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}
  private published<T extends { publishedSnapshot: unknown }>(row: T) {
    return (
      row.publishedSnapshot ??
      Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "publishedSnapshot"),
      )
    );
  }
  async page(slug: string) {
    const item = await this.prisma.page.findFirst({
      where: {
        slug,
        deletedAt: null,
        OR: [
          { status: ContentStatus.PUBLISHED },
          { publishedSnapshot: { not: Prisma.DbNull } },
        ],
      },
      select: {
        slug: true,
        title: true,
        publishedSnapshot: true,
        sections: {
          where: { isEnabled: true },
          orderBy: { displayOrder: "asc" },
          select: { key: true, kind: true, content: true, displayOrder: true },
        },
        seo: {
          select: {
            title: true,
            description: true,
            canonicalUrl: true,
            openGraph: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException("Page not found");
    return this.published(item);
  }
  private visibleServices() {
    return this.prisma.service.findMany({
      where: visibleServiceWhere,
      orderBy: { displayOrder: "asc" },
      select: {
        slug: true,
        name: true,
        summary: true,
        content: true,
        displayOrder: true,
        publishedSnapshot: true,
        updatedAt: true,
        seo: {
          select: {
            title: true,
            description: true,
            canonicalUrl: true,
            openGraph: true,
          },
        },
      },
    });
  }
  async services() {
    const rows = await this.visibleServices();
    // updatedAt is read from the live row (not the frozen publishedSnapshot, which
    // never carries it) so the sitemap can show an accurate lastmod regardless of
    // whether this entity is currently serving its snapshot or its live content.
    return rows.map((row) => ({ ...this.serviceView(row), updatedAt: row.updatedAt }));
  }
  async service(slug: string) {
    // Match the PUBLISHED slug (the snapshot's, else the row's), not the live row: a saved-but-
    // unpublished slug change must not move or break the live URL before Publish. Picked in
    // memory from the handful of visible services, so any snapshot shape resolves.
    const row = (await this.visibleServices()).find((entry) => publishedServiceField(entry, "slug") === slug);
    if (!row) throw new NotFoundException("Service not found");
    // The detail response never carried updatedAt (only the list does, for the sitemap).
    const { updatedAt, ...item } = row;
    void updatedAt;
    return this.serviceView(item);
  }
  // The published Name, Slug and Summary (the snapshot's, else the row's, so a snapshot missing
  // one of those keys still has it) win over stale copies inside the Content JSON (whose
  // "description" is the Summary copy), so editing the fields can never be undone by the JSON.
  private serviceView<T extends { publishedSnapshot: unknown; slug?: unknown; name?: unknown; summary?: unknown }>(row: T) {
    const slug = publishedServiceField(row, "slug");
    const name = publishedServiceField(row, "name");
    const summary = publishedServiceField(row, "summary");
    const view: Record<string, unknown> = {
      ...(this.published(row) as Record<string, unknown>),
      ...(slug !== undefined ? { slug } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(summary !== undefined ? { summary } : {}),
    };
    if (!view.content || typeof view.content !== "object" || Array.isArray(view.content)) return view;
    const content = view.content as Record<string, unknown>;
    return {
      ...view,
      content: {
        ...content,
        ...(slug ? { slug } : {}),
        ...(name ? { name } : {}),
        ...(summary ? { description: summary } : {}),
      },
    };
  }
  async portfolio(query: PortfolioQueryDto) {
    const where: Prisma.PortfolioProjectWhereInput = {
      deletedAt: null,
      OR: [
        { status: ContentStatus.PUBLISHED },
        { publishedSnapshot: { not: Prisma.DbNull } },
      ],
      category: query.category
        ? { slug: query.category, isActive: true }
        : { isActive: true },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.portfolioProject.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { displayOrder: "asc" },
        select: {
          slug: true,
          title: true,
          clientName: true,
          summary: true,
          content: true,
          displayOrder: true,
          publishedSnapshot: true,
          category: { select: { slug: true, name: true } },
          media: {
            orderBy: { displayOrder: "asc" },
            select: {
              displayOrder: true,
              media: {
                select: {
                  id: true,
                  url: true,
                  secureUrl: true,
                  title: true,
                  altText: true,
                  caption: true,
                  kind: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.portfolioProject.count({ where }),
    ]);
    return {
      items: items.map((row) => this.published(row)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
  private visibleCategories() {
    return this.prisma.portfolioCategory.findMany({
      where: visibleCategoryWhere,
      orderBy: { displayOrder: "asc" },
      select: { slug: true, name: true, publishedSnapshot: true, updatedAt: true },
    });
  }
  // The published category (snapshot), with its published slug and name: the snapshot's, else the
  // row's, so a snapshot without those keys still has them.
  private categoryView(row: { slug: string; name: string; publishedSnapshot: unknown }) {
    return {
      ...(row.publishedSnapshot as Record<string, unknown>),
      slug: publishedField(row, "slug") ?? row.slug,
      name: publishedField(row, "name") ?? row.name,
    };
  }
  // Matched on the PUBLISHED slug, in memory, so saving a slug change as a draft neither hides nor
  // moves the live category page before Publish.
  private async publishedCategory(slug: string) {
    return (await this.visibleCategories()).find((row) => (publishedField(row, "slug") ?? row.slug) === slug);
  }
  async portfolioCategories() {
    const rows = await this.visibleCategories();
    return rows.map((row) => ({ ...this.categoryView(row), updatedAt: row.updatedAt }));
  }
  async portfolioCategory(slug: string, query: PortfolioQueryDto) {
    const category = await this.publishedCategory(slug);
    if (!category) throw new NotFoundException("Portfolio category not found");
    const snapshot=category.publishedSnapshot as {galleryImages?:Array<{displayOrder:number;altText?:string|null;caption?:string|null;media:Record<string,unknown>}>};
    const gallery=(snapshot.galleryImages??[]).map(item=>({displayOrder:item.displayOrder,media:{...item.media,altText:item.altText||item.media.altText,caption:item.caption??item.media.caption}}));
    const total = gallery.length;
    const items = gallery.slice((query.page - 1) * query.limit, query.page * query.limit);
    return {
      category: this.categoryView(category),
      items,
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  }
  // Newest-uploaded images from a category's PUBLISHED gallery (the same snapshot the category
  // page shows). Gallery rows are re-created on every category save, so their own createdAt is
  // not the date an image was added; the media asset's upload time is the stable signal.
  async categoryLatestImages(slug: string, query: LatestImagesQueryDto) {
    const category = await this.publishedCategory(slug);
    if (!category) return { items: [] };
    const snapshot = category.publishedSnapshot as { galleryImages?: Array<{ altText?: string | null; caption?: string | null; media?: { id?: unknown; url?: unknown; secureUrl?: unknown; altText?: unknown; caption?: unknown } }> };
    const gallery = (snapshot.galleryImages ?? []).filter((item) => typeof item.media?.id === "string");
    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: [...new Set(gallery.map((item) => item.media!.id as string))] }, deletedAt: null, kind: MediaKind.IMAGE },
      select: { id: true, createdAt: true },
    });
    const uploadedAt = new Map(assets.map((asset) => [asset.id, asset.createdAt]));
    const items = gallery
      .filter((item) => uploadedAt.has(item.media!.id as string))
      .map((item) => {
        const media = item.media!;
        const id = media.id as string;
        return { id, url: stringValue(media.url), secureUrl: stringValue(media.secureUrl), altText: item.altText || stringValue(media.altText) || null, caption: item.caption || stringValue(media.caption) || null, uploadedAt: uploadedAt.get(id)! };
      })
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime() || a.id.localeCompare(b.id))
      .slice(0, query.limit);
    return { items };
  }
  // Service pages match a Portfolio Category 1:1 by slug and auto-populate their "Visual
  // Showcase" from it instead of a separately admin-managed gallery. A single query (the
  // category lookup with its most recent published projects selected as a nested relation)
  // keeps this to a fixed, small cost per page load regardless of how many projects exist.
  async categoryShowcase(categorySlug: string) {
    const SHOWCASE_LIMIT = 4;
    const category = await this.prisma.portfolioCategory.findFirst({
      where: { slug: categorySlug, isActive: true },
      select: {
        projects: {
          where: {
            deletedAt: null,
            OR: [
              { status: ContentStatus.PUBLISHED },
              { publishedSnapshot: { not: Prisma.DbNull } },
            ],
          },
          orderBy: [
            { publishedAt: { sort: "desc", nulls: "last" } },
            { updatedAt: "desc" },
          ],
          take: SHOWCASE_LIMIT,
          select: {
            slug: true,
            title: true,
            clientName: true,
            publishedSnapshot: true,
            media: {
              orderBy: { displayOrder: "asc" },
              take: 1,
              select: {
                media: {
                  select: {
                    url: true,
                    secureUrl: true,
                    title: true,
                    altText: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!category) return { items: [] };
    return { items: category.projects.map((row) => this.published(row)) };
  }
  async project(slug: string) {
    const item = await this.prisma.portfolioProject.findFirst({
      where: {
        slug,
        deletedAt: null,
        OR: [
          { status: ContentStatus.PUBLISHED },
          { publishedSnapshot: { not: Prisma.DbNull } },
        ],
      },
      select: {
        slug: true,
        title: true,
        clientName: true,
        summary: true,
        content: true,
        publishedSnapshot: true,
        category: { select: { slug: true, name: true } },
        service: { select: { slug: true, name: true } },
        media: {
          orderBy: { displayOrder: "asc" },
          select: {
            displayOrder: true,
            media: {
              select: {
                id: true,
                url: true,
                secureUrl: true,
                title: true,
                altText: true,
                caption: true,
                kind: true,
              },
            },
          },
        },
        seo: {
          select: {
            title: true,
            description: true,
            canonicalUrl: true,
            openGraph: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException("Portfolio project not found");
    return this.published(item);
  }
  async packages(query: PackageQueryDto) {
    const categories = await this.prisma.packageCategory.findMany({
      where: {
        isActive: true,
        ...(query.category ? { slug: query.category } : {}),
      },
      orderBy: { displayOrder: "asc" },
      select: {
        slug: true,
        name: true,
        headline: true,
        description: true,
        content: true,
        updatedAt: true,
        cardMedia: { select: { url: true, secureUrl: true, altText: true, deletedAt: true } },
        packages: {
          where: {
            isActive: true,
            OR: [
              { status: ContentStatus.PUBLISHED },
              { publishedSnapshot: { not: Prisma.DbNull } },
            ],
          },
          orderBy: { displayOrder: "asc" },
          select: {
            slug: true,
            name: true,
            subtitle: true,
            description: true,
            price: true,
            currency: true,
            priceLabel: true,
            ctaLabel: true,
            isPopular: true,
            displayOrder: true,
            publishedSnapshot: true,
            features: {
              orderBy: { displayOrder: "asc" },
              select: { label: true, displayOrder: true },
            },
          },
        },
      },
    });
    return categories.map((category) => {
      const packages = category.packages.map((row) =>
        this.published(row),
      ) as Array<Record<string, unknown>>;
      const rawContent =
        category.content &&
        typeof category.content === "object" &&
        !Array.isArray(category.content)
          ? (category.content as Record<string, unknown>)
          : {};
      // The frontend's PackageExperience type (and loadPackages(), which reads
      // row.content exclusively and drops every sibling field on the row) requires
      // slug/name/title/description/benefits/seoTitle/metaDescription to all live
      // inside this JSON blob. Categories created through the simple admin form only
      // set name/description/displayOrder/slug on the row itself, so without these
      // fallbacks loadPackages()'s `.filter(item => item.slug)` would silently drop
      // the category everywhere on the public site.
      const base = {
        slug: category.slug,
        name: category.name,
        title: category.headline || stringValue(rawContent.title) || category.name,
        description:
          category.description || stringValue(rawContent.description) || "",
        benefits: Array.isArray(rawContent.benefits) ? rawContent.benefits : [],
        seoTitle:
          stringValue(rawContent.seoTitle) || `${category.name} | DesignKoolama`,
        metaDescription:
          stringValue(rawContent.metaDescription) || category.description || "",
      };
      const tiers = packages.map((item) => ({
        category: category.slug,
        name: item.name,
        subtitle: item.subtitle ?? "",
        price: item.price
          ? `${stringValue(item.currency)} ${stringValue(item.price)}`.trim()
          : "Custom",
        priceLabel: item.priceLabel ?? "",
        description: item.description ?? "",
        features: Array.isArray(item.features)
          ? item.features.map(featureLabel)
          : [],
        recommended: Boolean(item.isPopular),
        ctaText: stringValue(item.ctaLabel) || `Choose ${stringValue(item.name) || "package"}`,
        order: Number(item.displayOrder ?? 0) + 1,
        active: true,
      }));
      const { cardMedia: media, ...row } = category;
      const cardMedia = media && !media.deletedAt ? { url: media.url, secureUrl: media.secureUrl, altText: media.altText } : null;
      return { ...row, content: { ...base, cardMedia, tiers }, packages };
    });
  }
  async package(slug: string) {
    const item = await this.prisma.package.findFirst({
      where: {
        slug,
        isActive: true,
        OR: [
          { status: ContentStatus.PUBLISHED },
          { publishedSnapshot: { not: Prisma.DbNull } },
        ],
        category: { isActive: true },
      },
      select: {
        slug: true,
        name: true,
        subtitle: true,
        description: true,
        price: true,
        currency: true,
        priceLabel: true,
        ctaLabel: true,
        isPopular: true,
        displayOrder: true,
        publishedSnapshot: true,
        category: {
          select: { slug: true, name: true, headline: true, description: true },
        },
        features: {
          orderBy: { displayOrder: "asc" },
          select: { label: true, displayOrder: true },
        },
      },
    });
    if (!item) throw new NotFoundException("Package not found");
    return this.published(item);
  }
  async testimonials() {
    const rows = await this.prisma.testimonial.findMany({
      where: {
        OR: [
          { status: ContentStatus.PUBLISHED },
          { publishedSnapshot: { not: Prisma.DbNull } },
        ],
      },
      orderBy: { displayOrder: "asc" },
      select: {
        clientName: true,
        clientRole: true,
        company: true,
        quote: true,
        rating: true,
        displayOrder: true,
        publishedSnapshot: true,
        avatar: { select: { id: true, url: true, secureUrl: true, title: true, altText: true, caption: true } },
      },
    });
    return rows.map((row) => this.published(row));
  }
  settings() {
    return this.prisma.siteSetting.findMany({
      where: { isPublic: true },
      orderBy: { key: "asc" },
      select: { key: true, value: true },
    });
  }
}
