# System Architecture

## Runtime topology

Browser clients reach a Next.js application. Server Components request published content from a versioned NestJS REST API. The API owns business rules and persists normalized content in PostgreSQL through Prisma. Media binaries are stored through a Cloudinary-compatible adapter; only metadata and references are persisted locally.

## Frontend

Next.js App Router with strict TypeScript, Tailwind CSS, reusable accessible UI primitives, Framer Motion for opt-in client animation, React Hook Form and Zod for interactive forms. Public pages are server-first and cache published API responses. Admin pages are noindexed and use middleware plus backend authorization.

The public shell owns canonical and social metadata, robots/sitemap output, safe schema.org JSON-LD serialization, keyboard skip navigation, focus management, and reduced-motion behavior. Route-specific service and portfolio schemas are composed from the same published content passed to the visible page. Compression and browser hardening headers are configured at the Next.js boundary.

Portfolio discovery and presentation are category-based: `/portfolio` renders the six published category snapshots and `/portfolio/category/[slug]` renders the category snapshot with images aggregated from published project snapshots assigned to that category. Project records remain revisioned Admin image groups; legacy `/portfolio/[slug]` paths are not indexed and do not expose project pages.

## Backend

NestJS modules are split by domain: auth, admins, pages, services, portfolio, packages, testimonials, media, quotes, contact, settings, SEO, activity log, and health. Global validation, exception mapping, response envelopes, request IDs, structured logs, Helmet, restricted CORS, and throttling are configured at the application boundary.

## Authentication and publishing

Short-lived access and rotating refresh tokens use Secure, SameSite, HttpOnly cookies. Refresh sessions are hashed and stored per device. Roles aggregate permissions; guards enforce both authentication and authorization. Content has isolated draft and published states. Draft edits remain in the editable entity while an immutable revision and JSON publication snapshot represent the live version. Public queries never expose drafts; preview requests require a short-lived HMAC-signed context scoped to one resource and record. Publish and unpublish actions enforce resource-specific RBAC and write audit events.

## Data and media

UUID primary keys, indexed slugs/status/order fields, timestamps, relational constraints, and selective soft deletion are used. Important multi-record writes run in transactions. The Cloudinary adapter streams validated image buffers from authenticated multipart requests; PostgreSQL stores metadata only. Media deletion checks references before invoking the storage adapter, and provider deletion must succeed before a managed record is archived.

## Deployment

Frontend and backend are independently deployable containers. PostgreSQL and Cloudinary-compatible storage are managed services. Migrations run as a release step; initial super-admin seeding consumes one-time environment values and stores only a password hash.

Production configuration validation enforces HTTPS origins, Secure authentication cookies, and a disabled development reset provider. Swagger is development-visible but production-disabled unless explicitly enabled. Release verification combines the complete Chromium regression with a focused Chromium/Firefox/WebKit matrix, dependency advisory auditing, production builds, and Prisma migration status.
# Portfolio public information architecture

The public Portfolio has one fixed category-card layer and one category-detail layer. `PortfolioCategoryGalleryImage` provides direct, ordered, reference-protected Media relationships for each category; public pages consume only the category's published snapshot. Legacy Portfolio Projects remain preserved for historical organization but are not required or queried for category galleries.
