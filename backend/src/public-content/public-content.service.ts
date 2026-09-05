import { Injectable, NotFoundException } from "@nestjs/common";
import { ContentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { PackageQueryDto, PortfolioQueryDto } from "./public-content.dto";
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
  async services() {
    const rows = await this.prisma.service.findMany({
      where: {
        deletedAt: null,
        OR: [
          { status: ContentStatus.PUBLISHED },
          { publishedSnapshot: { not: Prisma.DbNull } },
        ],
      },
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
    // updatedAt is read from the live row (not the frozen publishedSnapshot, which
    // never carries it) so the sitemap can show an accurate lastmod regardless of
    // whether this entity is currently serving its snapshot or its live content.
    return rows.map((row) => ({ ...this.published(row), updatedAt: row.updatedAt }));
  }
  async service(slug: string) {
    const item = await this.prisma.service.findFirst({
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
        name: true,
        summary: true,
        content: true,
        displayOrder: true,
        publishedSnapshot: true,
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
    if (!item) throw new NotFoundException("Service not found");
    return this.published(item);
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
  async portfolioCategories() {
    const rows = await this.prisma.portfolioCategory.findMany({
      where: {
        isActive: true,
        status: ContentStatus.PUBLISHED,
        publishedSnapshot: { not: Prisma.DbNull },
      },
      orderBy: { displayOrder: "asc" },
      select: { publishedSnapshot: true, updatedAt: true },
    });
    return rows.map((row) => ({
      ...(row.publishedSnapshot as Record<string, unknown>),
      updatedAt: row.updatedAt,
    }));
  }
  async portfolioCategory(slug: string, query: PortfolioQueryDto) {
    const category = await this.prisma.portfolioCategory.findFirst({
      where: {
        slug,
        isActive: true,
        status: ContentStatus.PUBLISHED,
        publishedSnapshot: { not: Prisma.DbNull },
      },
      select: { id: true, publishedSnapshot: true },
    });
    if (!category) throw new NotFoundException("Portfolio category not found");
    const snapshot=category.publishedSnapshot as {galleryImages?:Array<{displayOrder:number;altText?:string|null;caption?:string|null;media:Record<string,unknown>}>};
    const gallery=(snapshot.galleryImages??[]).map(item=>({displayOrder:item.displayOrder,media:{...item.media,altText:item.altText||item.media.altText,caption:item.caption??item.media.caption}}));
    const total = gallery.length;
    const items = gallery.slice((query.page - 1) * query.limit, query.page * query.limit);
    return {
      category: category.publishedSnapshot,
      items,
      pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
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
        title: stringValue(rawContent.title) || category.headline || category.name,
        description:
          stringValue(rawContent.description) || category.description || "",
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
      return { ...category, content: { ...base, tiers }, packages };
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
