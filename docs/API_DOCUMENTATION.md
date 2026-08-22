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

Supported resources are `pages`, `services`, `portfolio-categories`, `portfolio`, `package-categories`, `packages`, `testimonials`, `media`, `settings`, `quotes`, `contacts`, and `activity`. Super Administrators have full access. Content, Portfolio, and Inquiry managers are restricted to their planned domains. Media registration accepts HTTPS URLs and requires provider, MIME, size, title, and alternative-text metadata; binary provider upload remains behind the provider boundary.

The API is versioned below `/api/v1`. Public read endpoints return only published records. Public write endpoints accept contact and quote submissions with validation and rate limits. Admin endpoints live below `/api/v1/admin` and require cookie authentication plus permissions. Swagger is served at `/docs` outside production or when explicitly enabled.

Successful responses use `{ data, meta? }`; errors use `{ statusCode, code, message, details?, requestId, timestamp, path }`.

Phase 5 read routes are `/public/pages/:slug`, `/public/services`, `/public/services/:slug`, `/public/portfolio`, `/public/portfolio/:slug`, `/public/packages`, `/public/packages/:slug`, `/public/testimonials`, and `/public/settings`. Portfolio accepts validated `category`, `page`, and `limit` parameters and returns pagination metadata. Invalid slugs return 404.

`POST /contact` and `POST /quotes` persist validated submissions. Both include an empty `website` honeypot and are limited to five submissions per IP per minute. Quote attachment storage is explicitly deferred.

Local PostgreSQL verification on 2026-08-19 confirmed liveness/readiness, every public content family, detail reads, pagination, invalid-slug 404 responses, contact persistence, quote persistence, and linked quote service/package references. Browser verification used the real API with fallback disabled and confirmed validation, success-after-persistence, and API-unavailable states.

## Phase 6 administrator API

All routes use the `/api/v1/admin` prefix. Authentication routes are `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/forgot-password`, `/auth/reset-password`, and `/auth/change-password`; reads are `GET /auth/me`, `GET /auth/sessions`, and `DELETE /auth/sessions/:id`. `GET /dashboard` returns protected aggregate counts and privacy-minimised recent-submission previews.

Access and rotating refresh credentials are sent only as HttpOnly cookies. Mutating routes enforce the configured admin origin. Refresh tokens and password-reset tokens are stored only as keyed hashes. Forgot-password responses do not disclose account existence. The development reset-delivery provider is opt-in and is forcibly disabled in production; it never returns a reset token through the API.

Local Phase 6 verification confirmed real PostgreSQL login, generic invalid-credential rejection, protected-route enforcement, session-bound access cookies, refresh rotation and replay rejection, logout/logout-all, dashboard aggregates, profile reads, password change, one-time development reset, session listing/revocation, and persisted revocation/rotation/audit state. Verification restores the owner-configured password and emits no credentials, token values, or cookie values.
