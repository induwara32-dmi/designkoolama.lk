# Deployment

Build and deploy `frontend` and `backend` independently using Node.js 22 LTS. Provision PostgreSQL and Cloudinary-compatible storage first. Supply secrets through the platform secret manager, run `prisma migrate deploy` as a backend release step, and run the one-time super-admin seed with temporary credentials. Enforce TLS, use exact CORS origins, set secure cookies, and never expose database or media secrets to the frontend.

Health checks use `GET /api/v1/health`. Back up PostgreSQL before migrations and retain media-provider version history where supported.

Phase 6 production deployments must provide both admin token secrets, exact admin origin/reset URL, Secure cookie settings, and a production reset-email provider before administrator access is enabled. Run provisioning once with temporary secret-manager values for `INITIAL_SUPER_ADMIN_EMAIL` and `INITIAL_SUPER_ADMIN_PASSWORD`, remove those values afterward, sign in, and immediately rotate the password from the Security page. Never run provisioning as part of the ordinary application seed or startup command.

`npm run admin:verify` is a local development verification command. It runs against PostgreSQL, activates the in-memory reset provider only inside its non-production process, restores the configured owner password, revokes verification sessions, and never prints sensitive material. Do not use it as a production health check.

Phase 8 production deployments must set a distinct cryptographically random `CONTENT_PREVIEW_SECRET` and may tune `CONTENT_PREVIEW_TTL_SECONDS` between 60 and 3600 seconds. Preview tokens must never be logged or placed in analytics. Run the additive publishing migration before deploying the Phase 8 API. `npm run publishing:verify` is a local-only end-to-end database check that creates and removes a uniquely identified service record; it must not be used as a production health endpoint.

Phase 9 requires `NEXT_PUBLIC_SITE_URL` to be the exact canonical HTTPS frontend origin. Verify canonical links, JSON-LD, `robots.txt`, and `sitemap.xml` after deployment. The frontend emits compression-compatible responses plus nosniff, strict-origin referrer, restricted browser-permission, and same-origin opener headers. Keep these headers at the edge unless an equivalent stricter platform policy is deliberately configured. No Phase 9 external provider or new secret is required.
