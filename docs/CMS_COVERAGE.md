# CMS Coverage Audit

## Portfolio category image workflow

Portfolio categories use a dedicated visual editor rather than the generic record/JSON inspector. Administrators can upload or select a banner, upload multiple gallery images, detach individual images, edit optional accessibility details, save a draft, preview it, and explicitly publish it. Media identifiers and published snapshot objects stay hidden. Detaching a banner or gallery item preserves the shared Media Library and provider asset.

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
| Portfolio | Published category cards (title, description, approved icon, Media artwork, visibility and order), project content, category assignment, case-study copy, ordering, SEO and selected Media assets | Portfolio CMS | Draft/preview/publish/unpublish/revisions/audit |
| Packages | Category copy, tier copy/pricing/features/order/visibility and CTA content | Package CMS | Draft/publish/revisions/audit |
| Testimonials | Client, role, company, quote, rating, order and Media-library avatar | Testimonials CMS | Draft/publish/revisions/audit |
| SEO | Page, service and portfolio title, description, canonical path and structured Open Graph data | Corresponding editor | Included in the same published snapshot |

## Safe controls

- Links accept internal paths, anchors, `mailto:`, `tel:`, or HTTPS URLs only.
- Icons use the approved key allowlist displayed with previews in the Website Content editor. Arbitrary SVG and script are rejected.
- Structured page content is depth-, length-, key-, icon-, and URL-validated. It cannot contain editable HTML, CSS, JavaScript, source, or environment fields.
- Images are selected from Media-library records. Portfolio images and testimonial avatars use relation-backed selectors and retain reference deletion protection.
- The Portfolio editor uses readable category and optional service selectors. Its visual image library shows thumbnails, filenames, alternative text, cover/gallery state, removal, and ordering controls; inline secure upload preserves unsaved project fields and selects the new image without publishing it.
- Portfolio categories have a draft-first editor for category name/slug, short description, banner and its metadata, overview, card content/artwork, directly ordered gallery images with per-item metadata, ordering, and visibility. The public Portfolio index contains only category cards, each linking to its category page. Public galleries read only direct category gallery snapshots; unpublished edits remain hidden. Card, banner, and gallery Media references are deletion-protected.
- Media registration requires an HTTPS provider URL plus accessible title and alternative text. With the authorized Cloudinary configuration, administrators can instead upload JPEG, PNG, WebP, or AVIF files directly with required alternative text and an optional caption; the new asset appears immediately in the same selectors.

## Intentionally code-controlled

- Black/orange design tokens, layout grids, responsive breakpoints, animation implementation and reduced-motion behavior.
- Component structure, route definitions, API envelopes, form field types, submission validation, rate limits and error handling.
- Authentication, RBAC, cookies, preview signatures, audit behavior, database constraints and environment/provider configuration.
- JSON-LD serializers and crawler/security policy mechanics. Only their safe content inputs are editable.

## External media boundary

The Media library safely registers and reuses externally hosted HTTPS assets. Direct computer-to-provider upload uses the owner-authorized Cloudinary account when its backend-only variables are configured. Large binaries are streamed to the provider and are never stored in PostgreSQL; only provider identity, secure URL, dimensions, byte size, MIME type, filename, alternative text, and caption are persisted. Missing or failed provider configuration fails closed and does not fabricate an upload.
