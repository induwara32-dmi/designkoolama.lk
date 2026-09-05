# DesignKoolama

Production website and private CMS for DesignKoolama (Pvt) Ltd.

## Requirements

- Node.js 22 LTS (Node 24 is also accepted by the current engine range)
- npm 11+
- PostgreSQL 16+

## Setup

1. Copy `.env.example` to `.env` and replace every secret.
2. Run `npm install`.
3. Run `npm run prisma:generate -w backend`.
4. Run `npm run prisma:migrate -w backend` once PostgreSQL is available.
5. Run `npm run prisma:seed -w backend`.
6. Run `npm run dev`.

The frontend runs on `http://localhost:3000`; the API runs on `http://localhost:4000`, with Swagger at `/docs` and health at `/api/v1/health`.

Set `API_URL` for server-side content reads and `NEXT_PUBLIC_API_URL` for browser submissions. `CONTENT_FALLBACK_ENABLED=true` is an explicit development/test fallback only and is disabled by default.

## Administrator access

Admin pages live below `/admin` and are excluded from public navigation and indexing. Configure the Phase 6 variables documented in `.env.example`, apply migrations from the repository root with `npm run prisma:deploy`, then explicitly run `npm run admin:provision`. Provisioning is idempotent and never overwrites an existing password. After the first login, change the initial password from `/admin/security`; this revokes all active sessions.

See `PROJECT_PLAN.md`, `SYSTEM_ARCHITECTURE.md`, and `docs/DEPLOYMENT.md` for implementation and operations details.

## Media uploads

The Admin Media Library supports both existing HTTPS-URL registration and direct image upload through Cloudinary. Configure the five media variables in `.env.example`; credentials stay backend-only. Uploaded JPEG, PNG, WebP, and AVIF files are signature-checked, size-limited, stored remotely, and recorded in PostgreSQL with accessible metadata. Run `npm run media:verify` only in an authorized local environment to create, publish, verify, and remove a disposable image and portfolio record without printing provider details.

Portfolio management is category-first. Administrators manage category cards, banners, category-page copy, and ordered gallery images directly in Portfolio categories, then explicitly preview and publish the category snapshot. The public `/portfolio` index shows exactly the six published categories; `/portfolio/category/[slug]` reads only that category's published direct gallery. Legacy project records are preserved but are not required for new gallery content and do not create public cards or detail pages.

## Publishing workflow

Phase 8 CMS editors save drafts independently from the public website. Authorized administrators can create a short-lived signed preview, publish an immutable version, review publication history, or explicitly unpublish. Production requires a distinct `CONTENT_PREVIEW_SECRET`; local development may fall back to the configured access-token secret without exposing it. Run `npm run publishing:verify` for the safe local PostgreSQL workflow check.

## Public quality and discovery

Phase 9 adds reusable schema.org organization, website, service, breadcrumb, and creative-work data alongside canonical, Open Graph, Twitter, robots, and sitemap metadata. Public pages include a keyboard skip path, visible focus treatment, reduced-motion behavior, and a focus-managed mobile menu. Next.js supplies compression and additive browser security headers. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin in every deployed frontend environment.

## Production verification

Phase 10 verification uses `npm test` for the complete Chromium regression and `npm run test:cross-browser` for the targeted Chromium, Firefox, and WebKit production matrix. Before release, also run `npm run lint`, `npm run typecheck`, `npm run build`, `npm test -w backend`, Prisma format/validation/status, and `npm audit --omit=dev --audit-level=high`.

Production backend configuration fails closed unless public, Admin, and reset origins use HTTPS, Admin cookies are Secure, and the development reset provider is disabled. Swagger is unavailable in production unless `SWAGGER_ENABLED=true` is deliberately configured.
