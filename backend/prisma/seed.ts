import { ContentStatus, PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { services } from "../../frontend/src/content/services";
import { portfolioProjects } from "../../frontend/src/content/portfolio";
import { packageExperiences } from "../../frontend/src/content/packages";
loadEnvFile(resolve(__dirname, "../../.env"));
const prisma = new PrismaClient();
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
async function seed() {
  const pages = [
    "home",
    "about",
    "contact",
    "portfolio",
    "packages",
    "get-a-quote",
  ];
  for (const [displayOrder, slug] of pages.entries()) {
    const page = await prisma.page.upsert({
      where: { slug },
      update: {
        title: slug.replace(/-/g, " "),
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      create: {
        slug,
        title: slug.replace(/-/g, " "),
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    await prisma.pageSection.upsert({
      where: { pageId_key: { pageId: page.id, key: "approved-content" } },
      update: {
        content: { source: "Phase 2-4 approved typed content" },
        displayOrder,
        isEnabled: true,
      },
      create: {
        pageId: page.id,
        key: "approved-content",
        kind: "seed-reference",
        content: { source: "Phase 2-4 approved typed content" },
        displayOrder,
      },
    });
  }
  const serviceIds = new Map<string, string>();
  for (const [displayOrder, item] of services.entries()) {
    const row = await prisma.service.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        summary: item.description,
        content: item,
        status: ContentStatus.PUBLISHED,
        displayOrder,
        deletedAt: null,
      },
      create: {
        slug: item.slug,
        name: item.name,
        summary: item.description,
        content: item,
        status: ContentStatus.PUBLISHED,
        displayOrder,
      },
    });
    serviceIds.set(item.name, row.id);
    await prisma.seoMetadata.upsert({
      where: { serviceId: row.id },
      update: {
        title: item.seoTitle,
        description: item.metaDescription,
        canonicalUrl: `/services/${item.slug}`,
      },
      create: {
        serviceId: row.id,
        title: item.seoTitle,
        description: item.metaDescription,
        canonicalUrl: `/services/${item.slug}`,
      },
    });
  }
  const categoryIds = new Map<string, string>();
  const categories = [
    ...new Set(portfolioProjects.map((item) => item.category)),
  ];
  for (const [displayOrder, name] of categories.entries()) {
    const row = await prisma.portfolioCategory.upsert({
      where: { slug: slugify(name) },
      update: { name, displayOrder, isActive: true },
      create: { slug: slugify(name), name, displayOrder, isActive: true },
    });
    categoryIds.set(name, row.id);
  }
  for (const [displayOrder, item] of portfolioProjects.entries()) {
    const project = await prisma.portfolioProject.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        clientName: item.client,
        summary: item.description,
        content: item,
        categoryId: categoryIds.get(item.category)!,
        serviceId: serviceIds.get(item.category) ?? null,
        status: ContentStatus.PUBLISHED,
        displayOrder,
        deletedAt: null,
      },
      create: {
        slug: item.slug,
        title: item.title,
        clientName: item.client,
        summary: item.description,
        content: item,
        categoryId: categoryIds.get(item.category)!,
        serviceId: serviceIds.get(item.category) ?? null,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        displayOrder,
      },
    });
    await prisma.seoMetadata.upsert({
      where: { projectId: project.id },
      update: {
        title: `${item.title} | DesignKoolama`,
        description: item.description,
        canonicalUrl: `/portfolio/${item.slug}`,
      },
      create: {
        projectId: project.id,
        title: `${item.title} | DesignKoolama`,
        description: item.description,
        canonicalUrl: `/portfolio/${item.slug}`,
      },
    });
  }
  for (const [categoryOrder, experience] of packageExperiences.entries()) {
    const category = await prisma.packageCategory.upsert({
      where: { slug: experience.slug },
      update: {
        name: experience.name,
        headline: experience.title,
        description: experience.description,
        content: JSON.parse(JSON.stringify(experience)),
        displayOrder: categoryOrder,
        isActive: true,
      },
      create: {
        slug: experience.slug,
        name: experience.name,
        headline: experience.title,
        description: experience.description,
        content: JSON.parse(JSON.stringify(experience)),
        displayOrder: categoryOrder,
        isActive: true,
      },
    });
    for (const tier of experience.tiers) {
      const slug = `${experience.slug}-${slugify(tier.name)}`;
      const numeric = tier.price.startsWith("LKR")
        ? Number(tier.price.replace(/[^0-9.]/g, ""))
        : null;
      const row = await prisma.package.upsert({
        where: { slug },
        update: {
          categoryId: category.id,
          name: tier.name,
          subtitle: tier.subtitle,
          description: tier.description,
          price: numeric,
          priceLabel: tier.priceLabel,
          isPopular: !!tier.recommended,
          isActive: tier.active,
          status: ContentStatus.PUBLISHED,
          displayOrder: tier.order,
        },
        create: {
          slug,
          categoryId: category.id,
          name: tier.name,
          subtitle: tier.subtitle,
          description: tier.description,
          price: numeric,
          priceLabel: tier.priceLabel,
          isPopular: !!tier.recommended,
          isActive: tier.active,
          status: ContentStatus.PUBLISHED,
          displayOrder: tier.order,
        },
      });
      await prisma.packageFeature.deleteMany({ where: { packageId: row.id } });
      await prisma.packageFeature.createMany({
        data: tier.features.map((label, displayOrder) => ({
          packageId: row.id,
          label,
          displayOrder,
        })),
      });
    }
  }
  await prisma.testimonial.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { status: ContentStatus.PUBLISHED },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      clientName: "Nimal Perera",
      clientRole: "CEO",
      company: "Nova Tech",
      quote:
        "DesignKoolama exceeded our expectations with a modern brand identity and outstanding service throughout the project.",
      rating: 5,
      status: ContentStatus.PUBLISHED,
      displayOrder: 0,
    },
  });
  await prisma.siteSetting.upsert({
    where: { key: "content_source" },
    update: {
      value: { value: "PostgreSQL", temporary: false },
      isPublic: true,
    },
    create: {
      key: "content_source",
      value: { value: "PostgreSQL", temporary: false },
      isPublic: true,
    },
  });
}
seed().finally(() => prisma.$disconnect());
