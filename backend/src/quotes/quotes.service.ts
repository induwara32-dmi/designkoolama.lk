import { BadRequestException, Injectable } from "@nestjs/common";
import { ContentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateQuoteDto } from "./quote.dto";
@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateQuoteDto) {
    const serviceReference =
      dto.service === "Branding & Identity" ? "brand-identity" : dto.service;
    const service = await this.prisma.service.findFirst({
      where: {
        OR: [{ slug: serviceReference }, { name: serviceReference }],
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      select: { id: true, name: true },
    });
    if (!service) throw new BadRequestException("Select a valid service");
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
        serviceRequired: service.name,
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
