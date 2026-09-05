import { NotFoundException } from "@nestjs/common";
import { PublicContentService } from "../src/public-content/public-content.service";
describe("PublicContentService", () => {
  const prisma = {
    service: { findMany: jest.fn(), findFirst: jest.fn() },
    portfolioProject: { findMany: jest.fn(), count: jest.fn() },
    portfolioCategory: { findMany: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  } as never;
  const service = new PublicContentService(prisma);
  beforeEach(() => jest.clearAllMocks());
  it("orders and filters published services", async () => {
    (
      prisma as { service: { findMany: jest.Mock } }
    ).service.findMany.mockResolvedValue([]);
    await service.services();
    expect(
      (prisma as { service: { findMany: jest.Mock } }).service.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          OR: expect.arrayContaining([
            { status: "PUBLISHED" },
            expect.objectContaining({ publishedSnapshot: expect.any(Object) }),
          ]),
        }),
        orderBy: { displayOrder: "asc" },
      }),
    );
  });
  it("serves the stable publication snapshot while a newer draft exists", async () => {
    (
      prisma as { service: { findMany: jest.Mock } }
    ).service.findMany.mockResolvedValue([
      {
        slug: "branding",
        name: "Draft",
        publishedSnapshot: { slug: "branding", name: "Published" },
      },
    ]);
    await expect(service.services()).resolves.toEqual([
      { slug: "branding", name: "Published" },
    ]);
  });
  it("returns 404 for invalid service slugs", async () => {
    (
      prisma as { service: { findFirst: jest.Mock } }
    ).service.findFirst.mockResolvedValue(null);
    await expect(service.service("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it("applies portfolio filtering and pagination", async () => {
    (prisma as { $transaction: jest.Mock }).$transaction.mockResolvedValue([
      [],
      13,
    ]);
    const result = await service.portfolio({
      category: "branding",
      page: 2,
      limit: 5,
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 13,
      pages: 3,
    });
    expect(
      (prisma as { portfolioProject: { findMany: jest.Mock } }).portfolioProject
        .findMany,
    ).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5 }));
  });
  it("lists only published category snapshots", async () => {
    (
      prisma as { portfolioCategory: { findMany: jest.Mock } }
    ).portfolioCategory.findMany.mockResolvedValue([
      {
        publishedSnapshot: {
          slug: "branding-and-identity",
          name: "Branding & Identity",
        },
      },
    ]);
    await expect(service.portfolioCategories()).resolves.toEqual([
      {
        slug: "branding-and-identity",
        name: "Branding & Identity",
      },
    ]);
    expect(
      (prisma as { portfolioCategory: { findMany: jest.Mock } })
        .portfolioCategory.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          status: "PUBLISHED",
          publishedSnapshot: { not: expect.any(Object) },
        },
        orderBy: { displayOrder: "asc" },
        select: { publishedSnapshot: true, updatedAt: true },
      }),
    );
  });
  it("aggregates ordered images from published projects in the requested category", async () => {
    (
      prisma as { portfolioCategory: { findFirst: jest.Mock } }
    ).portfolioCategory.findFirst.mockResolvedValue({
      id: "category",
      publishedSnapshot: {
        slug: "branding-and-identity",
        name: "Branding & Identity",
        galleryImages: [
          {displayOrder:0,altText:"Category image",caption:"Category caption",media:{id:"image-1",altText:"Media alt",caption:null}},
        ],
      },
    });
    const result = await service.portfolioCategory("branding-and-identity", {
      page: 1,
      limit: 9,
    });
    expect(result.items).toEqual([
      {displayOrder:0,media:{id:"image-1",altText:"Category image",caption:"Category caption"}},
    ]);
    expect((prisma as {portfolioProject:{findMany:jest.Mock}}).portfolioProject.findMany).not.toHaveBeenCalled();
  });
  it("returns 404 for an unpublished category slug", async () => {
    (
      prisma as { portfolioCategory: { findFirst: jest.Mock } }
    ).portfolioCategory.findFirst.mockResolvedValue(null);
    await expect(
      service.portfolioCategory("missing", { page: 1, limit: 9 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
