import { Injectable } from "@nestjs/common";
import { ContentStatus, Prisma, SubmissionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

// A quote/contact is "open" until an admin has resolved it one way or another.
// CLOSED and SPAM are both terminal states set deliberately from the admin list
// (see AdminCmsService.updateSubmission), so neither should keep inflating this count.
const OPEN_SUBMISSION_STATUSES: SubmissionStatus[] = [
  SubmissionStatus.NEW,
  SubmissionStatus.IN_PROGRESS,
  SubmissionStatus.REPLIED,
];

// Mirrors the testimonials admin list's own default filter (AdminCmsService.list,
// "testimonials" case) so this count never drifts from what that list actually shows.
const LIVE_TESTIMONIAL_WHERE: Prisma.TestimonialWhereInput = {
  OR: [
    { status: { not: ContentStatus.ARCHIVED } },
    { publishedSnapshot: { not: Prisma.DbNull } },
  ],
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async overview() {
    const [
      projects,
      services,
      packages,
      quotes,
      contacts,
      testimonials,
      recentQuotes,
      recentContacts,
    ] = await this.prisma.$transaction([
      // Matches the "portfolio" admin list's default filter (deletedAt: null, no
      // status restriction) so this count never disagrees with that list.
      this.prisma.portfolioProject.count({ where: { deletedAt: null } }),
      // Matches the "services" admin list's default filter.
      this.prisma.service.count({ where: { deletedAt: null } }),
      // Matches the "packages" admin list's default filter (status not ARCHIVED).
      // Previously filtered on isActive instead, which could under- or over-count
      // relative to what that list actually shows for a package toggled inactive
      // without being archived.
      this.prisma.package.count({
        where: { status: { not: ContentStatus.ARCHIVED } },
      }),
      this.prisma.quoteRequest.count({
        where: { status: { in: OPEN_SUBMISSION_STATUSES } },
      }),
      this.prisma.contactMessage.count({
        where: { status: { in: OPEN_SUBMISSION_STATUSES } },
      }),
      this.prisma.testimonial.count({ where: LIVE_TESTIMONIAL_WHERE }),
      // No status filter here: "recent" means recent, not just unread -- the
      // NEW/viewed distinction is surfaced per item instead of hiding older ones.
      this.prisma.quoteRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          serviceRequired: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, subject: true, status: true, createdAt: true },
      }),
    ]);
    return {
      counts: { projects, services, packages, quotes, contacts, testimonials },
      recentQuotes,
      recentContacts,
    };
  }
}
