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
      prisma as { service: { findMany: jest.Mock } }
    ).service.findMany.mockResolvedValue([]);
    await expect(service.service("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it("resolves the published slug for every snapshot shape", async () => {
    const content = { slug: "stale", name: "Stale", description: "Stale" };
    (
      prisma as { service: { findMany: jest.Mock } }
    ).service.findMany.mockResolvedValue([
      // (a) published, no snapshot (as seeded)
      { slug: "seeded", name: "Seeded", summary: "Seeded summary", content, publishedSnapshot: null, updatedAt: new Date() },
      // (b) draft whose snapshot carries slug and name: the snapshot wins, the draft slug is not live
      { slug: "draft-slug", name: "Draft", summary: "Draft summary", content, publishedSnapshot: { slug: "live-slug", name: "Live", summary: "Live summary", content }, updatedAt: new Date() },
      // (c) snapshot without slug and name keys: the row's values are used
      { slug: "row-slug", name: "Row", summary: "Row summary", content, publishedSnapshot: { summary: "Snapshot summary", content }, updatedAt: new Date() },
    ]);
    await expect(service.service("seeded")).resolves.toMatchObject({ slug: "seeded", name: "Seeded", content: { slug: "seeded", name: "Seeded", description: "Seeded summary" } });
    await expect(service.service("live-slug")).resolves.toMatchObject({ slug: "live-slug", name: "Live", content: { slug: "live-slug", name: "Live", description: "Live summary" } });
    await expect(service.service("draft-slug")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.service("row-slug")).resolves.toMatchObject({ slug: "row-slug", name: "Row", summary: "Snapshot summary", content: { slug: "row-slug", name: "Row", description: "Snapshot summary" } });
    const listed = await service.services();
    expect(listed.map((item) => (item as { slug?: unknown }).slug)).toEqual(["seeded", "live-slug", "row-slug"]);
    expect(
      (prisma as { service: { findMany: jest.Mock } }).service.findMany,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, status: { not: "ARCHIVED" } }) }),
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
