# API Documentation

## Phase 9 public discovery contracts

Phase 9 does not change REST routes or response envelopes. Server-rendered public pages translate the existing published service and portfolio contracts into schema.org `Service` and `CreativeWork` documents with breadcrumb data. Organization and website schema are emitted globally. JSON-LD is serialized with HTML-significant characters escaped, and Admin/preview routes remain excluded from indexing and sitemap discovery.

## Phase 8 publishing API

Authenticated publishing routes use `/api/v1/admin/publishing/:resource/:id`:

- `POST /preview` returns a short-lived frontend preview path containing a signed, record-scoped context.
- `POST /publish` atomically stores an immutable numbered revision, updates the stable public snapshot, and audits the action.
- `POST /unpublish` removes the public snapshot and audits the action without deleting the editable record or its revision history.
- `GET /revisions` returns safe version metadata without exposing tokens or credentials.

Supported versioned resources are `pages`, `services`, `portfolio`, `packages`, and `testimonials`. Content and Portfolio managers remain restricted to their assigned resource families. `GET /api/v1/preview/:resource/:id?token=...` validates the signed context and returns the current draft only while the context is valid. Preview routes are noindex and excluded from the sitemap.

Existing public routes and envelopes are unchanged. Public reads use the stable publication snapshot when present and otherwise preserve legacy published-row behavior. Draft edits therefore cannot leak into the live API.

## Phase 7 Admin CMS

All routes below are under `/api/v1/admin/cms`, require the existing Phase 6 cookie session, enforce role-specific resource access, validate request bodies, and write mutation events to `ActivityLog`.

- `GET /:resource` lists records and supports optional `search` and `status` filters.
- `POST /:resource` creates supported content records.
- `PATCH /:resource/:id` updates supported content records.
- `DELETE /:resource/:id` safely archives supported records; referenced media cannot be archived.
- `PATCH /quotes/:id/status` and `PATCH /contacts/:id/status` triage submissions.

Supported resources are `pages`, `services`, `portfolio-categories`, `portfolio`, `package-categories`, `packages`, `testimonials`, `media`, `settings`, `quotes`, `contacts`, and `activity`. Super Administrators have full access. Content, Portfolio, and Inquiry managers are restricted to their planned domains. Media registration accepts HTTPS URLs and requires provider, MIME, size, title, and alternative-text metadata.

`POST /api/v1/admin/cms/media/upload` accepts one `multipart/form-data` image in `file`, required `altText`, and optional `caption`. It requires the authenticated Admin origin plus a Super Admin, Content Manager, or Portfolio Manager role, and is limited to ten attempts per administrator/IP per minute. JPEG, PNG, WebP, and AVIF signatures must match the declared MIME type; SVG and other files are rejected. The configured size limit is enforced before provider persistence. Success uses the normal `{ data }` envelope and returns safe Media metadata, never provider credentials. Provider failures do not create database rows. Referenced media returns a conflict on deletion; for managed Cloudinary records, remote deletion must succeed before the database record is archived.

The API is versioned below `/api/v1`. Public read endpoints return only published records. Public write endpoints accept contact and quote submissions with validation and rate limits. Admin endpoints live below `/api/v1/admin` and require cookie authentication plus permissions. Swagger is served at `/docs` outside production or when explicitly enabled.

Successful responses use `{ data, meta? }`; errors use `{ statusCode, code, message, details?, requestId, timestamp, path }`.

Phase 5 read routes are `/public/pages/:slug`, `/public/services`, `/public/services/:slug`, `/public/portfolio`, `/public/portfolio/:slug`, `/public/packages`, `/public/packages/:slug`, `/public/testimonials`, and `/public/settings`. Portfolio accepts validated `category`, `page`, and `limit` parameters and returns pagination metadata. Invalid slugs return 404.

The Portfolio information architecture adds `GET /public/portfolio-categories` for ordered published category cards. `GET /public/portfolio-categories/:slug?page=1&limit=9` returns category-level published content and the paginated ordered media aggregated from published project snapshots assigned to that category. Category drafts and unpublished project images never appear. Existing project endpoints remain available as compatibility contracts, but the public frontend does not expose individual project cards or case-study pages.

`POST /contact` and `POST /quotes` persist validated submissions. Both include an empty `website` honeypot and are limited to five submissions per IP per minute. Quote attachment storage is explicitly deferred.

Local PostgreSQL verification on 2026-08-19 confirmed liveness/readiness, every public content family, detail reads, pagination, invalid-slug 404 responses, contact persistence, quote persistence, and linked quote service/package references. Browser verification used the real API with fallback disabled and confirmed validation, success-after-persistence, and API-unavailable states.

## Phase 6 administrator API

All routes use the `/api/v1/admin` prefix. Authentication routes are `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/forgot-password`, `/auth/reset-password`, and `/auth/change-password`; reads are `GET /auth/me`, `GET /auth/sessions`, and `DELETE /auth/sessions/:id`. `GET /dashboard` returns protected aggregate counts and privacy-minimised recent-submission previews.

Access and rotating refresh credentials are sent only as HttpOnly cookies. Mutating routes enforce the configured admin origin. Refresh tokens and password-reset tokens are stored only as keyed hashes. Forgot-password responses do not disclose account existence. The development reset-delivery provider is opt-in and is forcibly disabled in production; it never returns a reset token through the API.

Local Phase 6 verification confirmed real PostgreSQL login, generic invalid-credential rejection, protected-route enforcement, session-bound access cookies, refresh rotation and replay rejection, logout/logout-all, dashboard aggregates, profile reads, password change, one-time development reset, session listing/revocation, and persisted revocation/rotation/audit state. Verification restores the owner-configured password and emits no credentials, token values, or cookie values.

## Phase 10 production exposure

Phase 10 adds no REST routes and changes no response envelope. Swagger remains available outside production. In production it is not mounted unless `SWAGGER_ENABLED=true` is explicitly supplied. Production environment validation rejects insecure HTTP origins, non-Secure Admin cookies, and an enabled development reset provider before the API starts.
# Portfolio category gallery contract

- `GET /api/v1/public/portfolio-categories` returns the six published category snapshots used by the main Portfolio cards.
- `GET /api/v1/public/portfolio-categories/:slug?page=1&limit=9` returns the published category snapshot plus an ordered, paginated `items` collection sourced only from the category's direct `PortfolioCategoryGalleryImage` publication snapshot.
- Portfolio Project titles and case-study fields are retained for Admin organization and revision history but are not a public navigation layer. Legacy project endpoints remain compatible for safe lookup/redirect behavior.
