# Database Plan

PostgreSQL is the source of truth. Prisma migrations are immutable after deployment. Public content uses `DRAFT`, `PUBLISHED`, and `ARCHIVED` states, explicit display ordering, UUID identifiers, and timestamps. User/session and inquiry tables remain separate from editable page content. Media references are checked before deletion. Seed operations are idempotent and never contain a committed administrator password.
