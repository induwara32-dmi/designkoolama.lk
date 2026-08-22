# Database Plan

## Phase 9

Phase 9 introduces no schema or data migration. SEO, structured data, accessibility, motion, and delivery performance are composed from existing published records at the Next.js boundary. Existing PostgreSQL data and all three applied migrations remain unchanged.

## Phase 10

Phase 10 required no schema migration or data mutation. Prisma format and validation passed with all three existing migrations applied and no pending migration. The Prisma CLI/client versions were aligned within Prisma 6 for dependency-security remediation; the schema, generated SQL, database constraints, and PostgreSQL records were unchanged.

PostgreSQL is the source of truth. Prisma migrations are immutable after deployment. Public content uses `DRAFT`, `PUBLISHED`, and `ARCHIVED` states, explicit display ordering, UUID identifiers, timestamps, and soft-delete fields where applicable.

The Phase 5 foundation migration is `backend/prisma/migrations/20260817000000_phase5_foundation/migration.sql`. After setting `DATABASE_URL`, run `npm run prisma:generate -w backend`, `npm run prisma:deploy -w backend`, and `npm run prisma:seed -w backend`. The seed uses stable slugs and upserts, and never modifies contact or quote records.

Local verification on 2026-08-19 applied the foundation migration successfully. The seed completed twice with stable counts and no duplicates: 6 pages, 6 services, 6 portfolio projects, 3 package categories, 9 package tiers, 1 testimonial, and 1 public settings record. Existing inquiry records were preserved.

The additive Phase 6 migration is `backend/prisma/migrations/20260819093745_phase6_auth/migration.sql`. It adds login-failure, lockout, password-change, refresh-rotation fields and the one-time `PasswordResetToken` table without modifying Phase 5 content or submissions. It was inspected and applied locally on 2026-08-19. Administrator credentials are never part of the content seed; use the explicit `npm run admin:provision` command with ignored environment values.

The initial local Super Admin was provisioned explicitly and an immediate second run confirmed one-user idempotency without changing credentials. Live verification confirmed persisted refresh rotations, revocations, password-change timestamps, used reset tokens, roles, and audit events. No content or inquiry records were reset.

The additive Phase 8 migration is `backend/prisma/migrations/20260822000000_phase8_publishing/migration.sql`. It adds nullable publication-snapshot columns and the `ContentRevision` table with version uniqueness and administrator attribution. Inspection confirmed that it contains no drops, renames, truncation, or data rewrites. It was applied successfully on 2026-08-22 and migration status reports no pending migrations.
