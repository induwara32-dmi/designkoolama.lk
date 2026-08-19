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

See `PROJECT_PLAN.md`, `SYSTEM_ARCHITECTURE.md`, and `docs/DEPLOYMENT.md` for implementation and operations details.
