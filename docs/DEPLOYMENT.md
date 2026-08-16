# Deployment

Build and deploy `frontend` and `backend` independently using Node.js 22 LTS. Provision PostgreSQL and Cloudinary-compatible storage first. Supply secrets through the platform secret manager, run `prisma migrate deploy` as a backend release step, and run the one-time super-admin seed with temporary credentials. Enforce TLS, use exact CORS origins, set secure cookies, and never expose database or media secrets to the frontend.

Health checks use `GET /api/v1/health`. Back up PostgreSQL before migrations and retain media-provider version history where supported.
