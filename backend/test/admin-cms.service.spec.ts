import { BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PrismaService } from "../src/prisma/prisma.service";
import { AdminCmsService } from "../src/admin-cms/admin-cms.service";

const admin = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@example.test",
  displayName: "Admin",
  roles: ["SUPER_ADMIN"],
};
describe("AdminCmsService", () => {
  const activityCreate = jest.fn(),
    serviceCreate = jest.fn(),
    serviceFindMany = jest.fn(),
    quoteFind = jest.fn(),
    quoteUpdate = jest.fn(),
    mediaFind = jest.fn(),
    mediaFindMany = jest.fn(),
    mediaUpdate = jest.fn(),
    mediaCount = jest.fn(),
    categoryFind = jest.fn(),
    categoryCreate = jest.fn(),
    categoryFindUnique = jest.fn(),
    categoryUpdate = jest.fn(),
    relatedServiceFind = jest.fn(),
    portfolioCreate = jest.fn(),
    portfolioFind = jest.fn(),
    portfolioUpdate = jest.fn();
  const prisma = {
    activityLog: { create: activityCreate },
    service: {
      create: serviceCreate,
      findMany: serviceFindMany,
      findFirst: relatedServiceFind,
    },
    portfolioCategory: { findFirst: categoryFind,create:categoryCreate,findUnique:categoryFindUnique,update:categoryUpdate },
    portfolioProject: {
      create: portfolioCreate,
      findUnique: portfolioFind,
      update: portfolioUpdate,
    },
    quoteRequest: { findUnique: quoteFind, update: quoteUpdate },
    contactMessage: { findUnique: jest.fn(), update: jest.fn() },
    mediaAsset: {
      findUnique: mediaFind,
      findMany: mediaFindMany,
      update: mediaUpdate,
      count: mediaCount,
    },
  } as unknown as PrismaService;
  let service: AdminCmsService;
  beforeEach(() => {
    jest.clearAllMocks();
    categoryFind.mockResolvedValue({ id: "category" });
    relatedServiceFind.mockResolvedValue({ id: "service" });
    mediaFindMany.mockImplementation(
      (query: { where: { id: { in: string[] } } }) =>
        query.where.id.in.map((id) => ({ id })),
    );
    mediaCount.mockImplementation((query:{where:{id:{in:string[]}}})=>new Set(query.where.id.in).size);
    service = new AdminCmsService(prisma);
  });
  it("rejects invalid service slugs before persistence", async () => {
    await expect(
      service.create(
        "services",
        { slug: "Not Safe", name: "Branding", summary: "Summary", content: {} },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(serviceCreate).not.toHaveBeenCalled();
  });
  it("creates content and records an audit event", async () => {
    const created = { id: "service-1", slug: "branding" };
    serviceCreate.mockResolvedValue(created);
    activityCreate.mockResolvedValue({});
    await expect(
      service.create(
        "services",
        { slug: "branding", name: "Branding", summary: "Summary", content: {} },
        admin,
      ),
    ).resolves.toEqual(created);
    expect(activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "CMS_CREATE",
          entityType: "services",
          entityId: "service-1",
        }),
      }),
    );
  });
  it("allows only HTTPS media URLs", async () => {
    await expect(
      service.create(
        "media",
        {
          providerId: "asset",
          url: "http://unsafe.test/a.jpg",
          title: "Asset",
          altText: "Alt",
          mimeType: "image/jpeg",
          bytes: 10,
        },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it("does not archive referenced media", async () => {
    mediaFind.mockResolvedValue({
      _count: { portfolioUses: 1, testimonialUses: 0, quoteAttachments: 0 },
    });
    await expect(
      service.remove("media", "asset-id", admin),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mediaUpdate).not.toHaveBeenCalled();
  });
  it("updates a submission and records before and after values", async () => {
    quoteFind.mockResolvedValue({ id: "quote-1", status: "NEW" });
    quoteUpdate.mockResolvedValue({ id: "quote-1", status: "REPLIED" });
    activityCreate.mockResolvedValue({});
    await expect(
      service.updateSubmission("quotes", "quote-1", "REPLIED", admin),
    ).resolves.toMatchObject({ status: "REPLIED" });
    expect(activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "SUBMISSION_STATUS" }),
      }),
    );
  });
  it("passes normalized search criteria to list queries", async () => {
    serviceFindMany.mockResolvedValue([]);
    await service.list("services", { search: "brand" });
    expect(serviceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });
  it("accepts only allowlisted CMS icon keys", async () => {
    await expect(
      service.create(
        "services",
        {
          slug: "branding",
          name: "Branding",
          summary: "Summary",
          content: { iconKey: "<svg onload=alert(1)>" },
        },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(serviceCreate).not.toHaveBeenCalled();
  });
  it("rejects scriptable CMS links", async () => {
    await expect(
      service.create(
        "services",
        {
          slug: "branding",
          name: "Branding",
          summary: "Summary",
          content: { buttonHref: "javascript:alert(1)" },
        },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(serviceCreate).not.toHaveBeenCalled();
  });
  it("creates a portfolio draft with its category, optional service, and ordered media", async () => {
    portfolioCreate.mockResolvedValue({ id: "project" });
    activityCreate.mockResolvedValue({});
    await service.create(
      "portfolio",
      {
        slug: "project",
        title: "Project",
        categoryId: "category",
        serviceId: "service",
        summary: "Summary",
        content: {},
        mediaIds: ["cover", "gallery"],
      },
      admin,
    );
    expect(portfolioCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoryId: "category",
          serviceId: "service",
          status: "DRAFT",
          media: {
            create: [
              { mediaId: "cover", displayOrder: 0 },
              { mediaId: "gallery", displayOrder: 1 },
            ],
          },
        }),
        include: expect.objectContaining({ media: expect.any(Object) }),
      }),
    );
  });
  it("normalizes an omitted related service to null", async () => {
    portfolioCreate.mockResolvedValue({ id: "project" });
    activityCreate.mockResolvedValue({});
    await service.create(
      "portfolio",
      {
        slug: "project-without-service",
        title: "Project",
        categoryId: "category",
        serviceId: "",
        summary: "Summary",
        content: {},
        mediaIds: ["cover"],
      },
      admin,
    );
    expect(relatedServiceFind).not.toHaveBeenCalled();
    expect(portfolioCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceId: null }),
      }),
    );
  });
  it("returns a clear conflict for a duplicate project slug", async () => {
    portfolioCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "6.12.0",
        meta: { target: ["slug"] },
      }),
    );
    await expect(
      service.create(
        "portfolio",
        {
          slug: "project",
          title: "Project",
          categoryId: "category",
          summary: "Summary",
          content: {},
          mediaIds: ["cover"],
        },
        admin,
      ),
    ).rejects.toThrow(
      "This project URL already exists. Please choose another slug.",
    );
  });
  it("rejects an unavailable category before project persistence", async () => {
    categoryFind.mockResolvedValue(null);
    await expect(
      service.create(
        "portfolio",
        {
          slug: "project",
          title: "Project",
          categoryId: "missing-category",
          summary: "Summary",
          content: {},
          mediaIds: ["cover"],
        },
        admin,
      ),
    ).rejects.toThrow("Select a valid portfolio category before saving.");
    expect(portfolioCreate).not.toHaveBeenCalled();
  });
  it("rejects unavailable optional services and selected images", async () => {
    relatedServiceFind.mockResolvedValue(null);
    await expect(
      service.create(
        "portfolio",
        {
          slug: "project",
          title: "Project",
          categoryId: "category",
          serviceId: "missing-service",
          summary: "Summary",
          content: {},
          mediaIds: ["cover"],
        },
        admin,
      ),
    ).rejects.toThrow("The selected related service is unavailable.");
    relatedServiceFind.mockResolvedValue({ id: "service" });
    mediaFindMany.mockResolvedValue([]);
    await expect(
      service.create(
        "portfolio",
        {
          slug: "project",
          title: "Project",
          categoryId: "category",
          summary: "Summary",
          content: {},
          mediaIds: ["missing-image"],
        },
        admin,
      ),
    ).rejects.toThrow("One or more selected images are unavailable");
  });
  it("updates portfolio relationships and replaces ordered draft media without publishing", async () => {
    portfolioFind.mockResolvedValue({
      id: "project",
      publishedSnapshot: { title: "Published" },
    });
    portfolioUpdate.mockResolvedValue({ id: "project" });
    activityCreate.mockResolvedValue({});
    await service.update(
      "portfolio",
      "project",
      {
        categoryId: "new-category",
        serviceId: "",
        clientName: "Client",
        mediaIds: ["new-cover"],
      },
      admin,
    );
    expect(portfolioUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoryId: "new-category",
          serviceId: null,
          clientName: "Client",
          status: "DRAFT",
          media: {
            deleteMany: {},
            create: [{ mediaId: "new-cover", displayOrder: 0 }],
          },
        }),
      }),
    );
  });
  it("creates a draft category with independent banner and ordered gallery media",async()=>{
    categoryCreate.mockResolvedValue({id:"category-new"});activityCreate.mockResolvedValue({});
    await service.create("portfolio-categories",{slug:"branding",name:"Branding",cardTitle:"Branding",description:"Card",shortDescription:"Short",overview:"Overview",bannerMediaId:"banner",bannerAltText:"Banner alt",bannerCaption:"Banner caption",galleryImages:[{mediaId:"second",altText:"Second",caption:"Two"},{mediaId:"first",altText:"First",caption:"One"}],displayOrder:0,isActive:true},admin);
    expect(categoryCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({status:"DRAFT",bannerMediaId:"banner",galleryImages:{create:[{mediaId:"second",altText:"Second",caption:"Two",displayOrder:0},{mediaId:"first",altText:"First",caption:"One",displayOrder:1}]}})}));
  });
  it("replaces category gallery relations in a draft without changing the published snapshot",async()=>{
    categoryFindUnique.mockResolvedValue({id:"category",status:"PUBLISHED",publishedSnapshot:{galleryImages:[{mediaId:"published"}]},cardMediaId:null,bannerMediaId:"banner",galleryImages:[]});categoryUpdate.mockResolvedValue({id:"category"});activityCreate.mockResolvedValue({});
    await service.update("portfolio-categories","category",{galleryImages:[{mediaId:"replacement",altText:"Replacement",caption:"Updated"}]},admin);
    expect(categoryUpdate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({status:"DRAFT",publishedSnapshot:undefined,galleryImages:{deleteMany:{},create:[{mediaId:"replacement",altText:"Replacement",caption:"Updated",displayOrder:0}]}})}));
  });
});
