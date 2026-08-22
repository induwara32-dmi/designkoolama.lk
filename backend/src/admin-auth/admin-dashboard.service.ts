import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async overview() {
    const [projects, services, packages, quotes, contacts, testimonials, recentQuotes, recentContacts] = await this.prisma.$transaction([
      this.prisma.portfolioProject.count({ where: { deletedAt: null } }),
      this.prisma.service.count({ where: { deletedAt: null } }),
      this.prisma.package.count({ where: { isActive: true } }),
      this.prisma.quoteRequest.count({ where: { status: "NEW" } }),
      this.prisma.contactMessage.count({ where: { status: "NEW" } }),
      this.prisma.testimonial.count({ where: { status: "PUBLISHED" } }),
      this.prisma.quoteRequest.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, serviceRequired: true, status: true, createdAt: true } }),
      this.prisma.contactMessage.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, subject: true, status: true, createdAt: true } }),
    ]);
    return { counts: { projects, services, packages, quotes, contacts, testimonials }, recentQuotes, recentContacts };
  }
}
