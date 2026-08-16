# Project Plan

## Reference inventory

The supplied overview contains fourteen public compositions: Home, About, Contact, Portfolio, Brand Identity, Print Advertising, Social Media Design, Packaging Design, Merchandise Design, 3D Design, Main Packages, Tutor Packages, Branding Packages, and Photography Packages. Shared elements include a compact dark navbar, centered hero treatments, orange-gradient CTAs, charcoal cards, portfolio/showcase grids, CTA bands, and a multi-column footer.

Only an overview-scale export is currently available. Exact copy and imagery that cannot be read will be modeled as CMS-owned seed content and can be replaced without code changes. Full-resolution exports should be placed in `design-reference/` when available.

## Delivery phases

1. Foundation: monorepo, architecture, TypeScript, linting, environment validation, design tokens, application shells.
2. Shared public UI and Home page.
3. About, Contact, Quote, Portfolio, and case studies.
4. Reusable service and package templates for every supplied route.
5. PostgreSQL schema, migrations, seeds, and public APIs.
6. Cookie authentication, RBAC, private admin shell.
7. CMS CRUD, submissions, media library, settings, and audit log.
8. Draft/preview/publish flow and live public integration.
9. Motion, accessibility, SEO, structured data, and performance.
10. Cross-browser, responsive, security, production-build, and deployment verification.

## Quality gates

Each phase requires lint, strict type checking, relevant Jest/Playwright coverage, production builds, visual checks at 320/375/430/768/1024/1280/1440/1920 pixels, and a status update.
