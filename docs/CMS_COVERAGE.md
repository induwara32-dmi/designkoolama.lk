# CMS Coverage Audit

This audit distinguishes public content from code-controlled presentation and security. Public content is structured data only: HTML, JavaScript, CSS, source code, environment configuration, authentication rules, validation rules, layout primitives, animation mechanics, and design tokens are intentionally not editable.

| Surface | Editable content | CMS owner | Publication behavior |
| --- | --- | --- | --- |
| Shared header | Brand label, navigation labels/links, visibility/order, quote CTA | `site-settings` page / `site` section | Draft, signed preview, publish, revisions, audit |
| Shared footer | Brand copy, headings, quick links, legal labels/links, copyright | `site-settings` page | Draft/publish/revisions/audit |
| Contact and social | Email addresses, phone label/link, hours, address, social labels/links/order/visibility and approved icon keys | `site-settings` page | Draft/publish/revisions/audit |
| Home | Hero, CTA labels, section headings, service cards/icons/order/visibility, statistics/order/visibility, featured projects, testimonial, quote section | `home` page / `content` section | Draft/publish/revisions/audit |
| About | Hero, story, facts, founder content, mission, vision, values, contact and advantage copy | `about` page sections | Draft/publish/revisions/audit |
| Contact | Hero, contact cards, map labels/link, FAQ ordering/content, section headings | `contact` page sections | Draft/publish/revisions/audit |
| Quote | Hero, instructions, consent/privacy copy and section labels | `get-a-quote` page sections | Draft/publish/revisions/audit |
| Services | Names, descriptions, deliverables, process, showcase labels, related services, CTA copy and SEO | Services CMS | Draft/publish/revisions/audit |
| Portfolio | Categories, project content, case-study copy, ordering, SEO and selected Media assets | Portfolio CMS | Draft/publish/revisions/audit |
| Packages | Category copy, tier copy/pricing/features/order/visibility and CTA content | Package CMS | Draft/publish/revisions/audit |
| Testimonials | Client, role, company, quote, rating, order and Media-library avatar | Testimonials CMS | Draft/publish/revisions/audit |
| SEO | Page, service and portfolio title, description, canonical path and structured Open Graph data | Corresponding editor | Included in the same published snapshot |

## Safe controls

- Links accept internal paths, anchors, `mailto:`, `tel:`, or HTTPS URLs only.
- Icons use the approved key allowlist displayed with previews in the Website Content editor. Arbitrary SVG and script are rejected.
- Structured page content is depth-, length-, key-, icon-, and URL-validated. It cannot contain editable HTML, CSS, JavaScript, source, or environment fields.
- Images are selected from Media-library records. Portfolio images and testimonial avatars use relation-backed selectors and retain reference deletion protection.
- Media registration requires an HTTPS provider URL plus accessible title and alternative text.

## Intentionally code-controlled

- Black/orange design tokens, layout grids, responsive breakpoints, animation implementation and reduced-motion behavior.
- Component structure, route definitions, API envelopes, form field types, submission validation, rate limits and error handling.
- Authentication, RBAC, cookies, preview signatures, audit behavior, database constraints and environment/provider configuration.
- JSON-LD serializers and crawler/security policy mechanics. Only their safe content inputs are editable.

## External media boundary

The Media library safely registers and reuses externally hosted HTTPS assets. Direct binary upload from a computer requires an owner-authorized external media provider and provider credentials. Large binaries are not stored in PostgreSQL, and no upload provider is fabricated or silently enabled.
