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
    return rows.map((row) => this.published(row));
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
          media: { orderBy: { displayOrder: "asc" }, select: { displayOrder: true, media: { select: { id: true, url: true, secureUrl: true, title: true, altText: true, caption: true, kind: true } } } },
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
        media: { orderBy: { displayOrder: "asc" }, select: { displayOrder: true, media: { select: { id: true, url: true, secureUrl: true, title: true, altText: true, caption: true, kind: true } } } },
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
      const base =
        category.content &&
        typeof category.content === "object" &&
        !Array.isArray(category.content)
          ? (category.content as Record<string, unknown>)
          : {};
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
        ctaText: `Choose ${stringValue(item.name) || "package"}`,
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
