import { BadRequestException, Injectable } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { publishedServiceField, visibleServiceWhere } from "../public-content/published-service";
import type { CreateQuoteDto } from "./quote.dto";
// Retired service names/slugs (lowercase) and the slug they now refer to. Only used when
// nothing live matches the submitted value, e.g. a form or bookmark from before a rename.
const RETIRED_SERVICE_REFERENCES: Readonly<Record<string, string>> = {
  "packaging design": "book-cover-design",
  "packaging-design": "book-cover-design",
};
@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateQuoteDto) {
    const serviceReference =
      dto.service === "Branding & Identity" ? "brand-identity" : dto.service;
    const retired = RETIRED_SERVICE_REFERENCES[serviceReference.trim().toLowerCase()];
    // Same visibility as the public API, matched in memory on the PUBLISHED slug/name (the
    // snapshot's, else the row's), so a service being edited (status DRAFT) still accepts quotes
    // under its published name/slug, whatever keys its snapshot has.
    const visible = await this.prisma.service.findMany({
      where: visibleServiceWhere,
      orderBy: { displayOrder: "asc" },
      select: { id: true, slug: true, name: true, publishedSnapshot: true },
    });
    const matching = (reference: string) =>
      visible.find(
        (row) =>
          publishedServiceField(row, "slug") === reference ||
          publishedServiceField(row, "name") === reference,
      );
    const service =
      matching(serviceReference) ?? (retired ? matching(retired) : undefined);
    if (!service) throw new BadRequestException("Select a valid service");
    const serviceName = publishedServiceField(service, "name") ?? service.name;
    const selected = dto.selectedPackage
      ? await this.prisma.package.findFirst({
          where: {
            OR: [{ slug: dto.selectedPackage }, { name: dto.selectedPackage }],
            status: ContentStatus.PUBLISHED,
            isActive: true,
          },
          select: { id: true, name: true },
        })
      : null;
    if (dto.selectedPackage && !selected)
      throw new BadRequestException("Select a valid package");
    return this.prisma.quoteRequest.create({
      data: {
        fullName: dto.fullName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        company: dto.company?.trim() || null,
        serviceRequired: serviceName,
        selectedPackage: selected?.name,
        serviceId: service.id,
        packageId: selected?.id,
        budget: dto.budget || null,
        deadline: new Date(dto.deadline),
        preferredContact: dto.preferredContact,
        projectDetails: dto.projectDetails.trim(),
      },
      select: { id: true, status: true, createdAt: true },
    });
  }
}
