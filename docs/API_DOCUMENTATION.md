# API Documentation

The API is versioned below `/api/v1`. Public read endpoints return only published records. Public write endpoints accept contact and quote submissions with validation and rate limits. Admin endpoints live below `/api/v1/admin` and require cookie authentication plus permissions. Swagger is served at `/docs` outside production or when explicitly enabled.

Successful responses use `{ data, meta? }`; errors use `{ statusCode, code, message, details?, requestId, timestamp, path }`.

Phase 5 read routes are `/public/pages/:slug`, `/public/services`, `/public/services/:slug`, `/public/portfolio`, `/public/portfolio/:slug`, `/public/packages`, `/public/packages/:slug`, `/public/testimonials`, and `/public/settings`. Portfolio accepts validated `category`, `page`, and `limit` parameters and returns pagination metadata. Invalid slugs return 404.

`POST /contact` and `POST /quotes` persist validated submissions. Both include an empty `website` honeypot and are limited to five submissions per IP per minute. Quote attachment storage is explicitly deferred.

Local PostgreSQL verification on 2026-08-19 confirmed liveness/readiness, every public content family, detail reads, pagination, invalid-slug 404 responses, contact persistence, quote persistence, and linked quote service/package references. Browser verification used the real API with fallback disabled and confirmed validation, success-after-persistence, and API-unavailable states.
