# Database Plan

PostgreSQL is the source of truth. Prisma migrations are immutable after deployment. Public content uses `DRAFT`, `PUBLISHED`, and `ARCHIVED` states, explicit display ordering, UUID identifiers, timestamps, and soft-delete fields where applicable.

The Phase 5 foundation migration is `backend/prisma/migrations/20260817000000_phase5_foundation/migration.sql`. After setting `DATABASE_URL`, run `npm run prisma:generate -w backend`, `npm run prisma:deploy -w backend`, and `npm run prisma:seed -w backend`. The seed uses stable slugs and upserts, and never modifies contact or quote records.

Local verification on 2026-08-19 applied the foundation migration successfully. The seed completed twice with stable counts and no duplicates: 6 pages, 6 services, 6 portfolio projects, 3 package categories, 9 package tiers, 1 testimonial, and 1 public settings record. Existing inquiry records were preserved.
