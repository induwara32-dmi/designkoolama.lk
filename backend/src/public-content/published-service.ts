import { ContentStatus, Prisma } from "@prisma/client";

// Services the public site may show: not deleted or archived, and either published or holding a
// published snapshot (a published service whose newer edits are saved as a draft).
export const visibleServiceWhere = {
  deletedAt: null,
  status: { not: ContentStatus.ARCHIVED },
  OR: [{ status: ContentStatus.PUBLISHED }, { publishedSnapshot: { not: Prisma.DbNull } }],
} satisfies Prisma.ServiceWhereInput;

// Portfolio categories the public site may show: visible, not archived, and holding a published
// snapshot. Status is not required to be PUBLISHED, so a category whose newer edits are saved as a
// draft keeps serving its published version (unpublish and archive both clear the snapshot).
export const visibleCategoryWhere = {
  isActive: true,
  status: { not: ContentStatus.ARCHIVED },
  publishedSnapshot: { not: Prisma.DbNull },
} satisfies Prisma.PortfolioCategoryWhereInput;

// The published value of a top-level field: the snapshot's copy when it has one, else the row's.
// Read in memory rather than with a JSON-path query, so a snapshot without that key still resolves.
export function publishedField(
  row: { publishedSnapshot: unknown } & { [key: string]: unknown },
  key: string,
): string | undefined {
  const snapshot = row.publishedSnapshot;
  const fromSnapshot =
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
      ? (snapshot as Record<string, unknown>)[key]
      : undefined;
  const value = typeof fromSnapshot === "string" ? fromSnapshot : row[key];
  return typeof value === "string" ? value : undefined;
}
export const publishedServiceField = (
  row: { publishedSnapshot: unknown; slug?: unknown; name?: unknown; summary?: unknown },
  key: "slug" | "name" | "summary",
) => publishedField(row, key);
