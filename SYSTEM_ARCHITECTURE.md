# System Architecture

## Runtime topology

Browser clients reach a Next.js application. Server Components request published content from a versioned NestJS REST API. The API owns business rules and persists normalized content in PostgreSQL through Prisma. Media binaries are stored through a Cloudinary-compatible adapter; only metadata and references are persisted locally.

## Frontend

Next.js App Router with strict TypeScript, Tailwind CSS, reusable accessible UI primitives, Framer Motion for opt-in client animation, React Hook Form and Zod for interactive forms. Public pages are server-first and cache published API responses. Admin pages are noindexed and use middleware plus backend authorization.

## Backend

NestJS modules are split by domain: auth, admins, pages, services, portfolio, packages, testimonials, media, quotes, contact, settings, SEO, activity log, and health. Global validation, exception mapping, response envelopes, request IDs, structured logs, Helmet, restricted CORS, and throttling are configured at the application boundary.

## Authentication and publishing

Short-lived access and rotating refresh tokens use Secure, SameSite, HttpOnly cookies. Refresh sessions are hashed and stored per device. Roles aggregate permissions; guards enforce both authentication and authorization. Content has draft and published states. Public queries never expose drafts; preview requests require an authorized signed context.

## Data and media

UUID primary keys, indexed slugs/status/order fields, timestamps, relational constraints, and selective soft deletion are used. Important multi-record writes run in transactions. Media deletion checks references before invoking the storage adapter.

## Deployment

Frontend and backend are independently deployable containers. PostgreSQL and Cloudinary-compatible storage are managed services. Migrations run as a release step; initial super-admin seeding consumes one-time environment values and stores only a password hash.
