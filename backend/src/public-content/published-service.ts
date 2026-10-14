import { ContentStatus, Prisma } from "@prisma/client";

// Services the public site may show: not deleted or archived, and either published or holding a
// published snapshot (a published service whose newer edits are saved as a draft).
export const visibleServiceWhere = {
  deletedAt: null,
  status: { not: ContentStatus.ARCHIVED },
  OR: [{ status: ContentStatus.PUBLISHED }, { publishedSnapshot: { not: Prisma.DbNull } }],
} satisfies Prisma.ServiceWhereInput;

// The published value of a top-level field: the snapshot's copy when it has one, else the row's.
// Read in memory rather than with a JSON-path query, so a snapshot without that key still resolves.
export function publishedServiceField(
  row: { publishedSnapshot: unknown; slug?: unknown; name?: unknown; summary?: unknown },
  key: "slug" | "name" | "summary",
): string | undefined {
  const snapshot = row.publishedSnapshot;
  const fromSnapshot =
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
      ? (snapshot as Record<string, unknown>)[key]
      : undefined;
  const value = typeof fromSnapshot === "string" ? fromSnapshot : row[key];
  return typeof value === "string" ? value : undefined;
}
