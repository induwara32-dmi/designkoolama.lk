# API Documentation

The API is versioned below `/api/v1`. Public read endpoints return only published records. Public write endpoints accept contact and quote submissions with validation and rate limits. Admin endpoints live below `/api/v1/admin` and require cookie authentication plus permissions. Swagger is served at `/docs` outside production or when explicitly enabled.

Successful responses use `{ data, meta? }`; errors use `{ statusCode, code, message, details?, requestId, timestamp, path }`.
