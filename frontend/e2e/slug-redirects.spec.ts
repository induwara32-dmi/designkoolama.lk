import { expect, test } from "@playwright/test";
import { CATEGORY_ROUTES, PACKAGE_ROUTES, SERVICE_ROUTES, liveSlugFor, resolveSlugRoute } from "../src/lib/slug-routes";

const packagesAfter = ["videography", "branding", "photography"];
const packagesBefore = ["photography", "branding", "tutor"];
const servicesBefore = ["brand-identity", "print-advertising", "social-media-design", "packaging-design", "merchandise-design", "3d-design"];
const categoriesBefore = ["branding-and-identity", "print-advertising", "social-media-design", "packaging-design", "merchandise-design", "3d-design"];
const categoriesAfter = ["branding-and-identity", "print-advertising", "social-media-design", "book-cover-design", "merchandise-design", "3d-design"];
const servicesAfter = ["brand-identity", "print-advertising", "social-media-design", "book-cover-design", "merchandise-design", "3d-design"];

test.describe("package route resolver", () => {
  test("live slugs render their page and never redirect", () => {
    for (const slug of packagesAfter) expect(resolveSlugRoute(slug, packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "page", slug });
    expect(resolveSlugRoute("photography", packagesBefore, PACKAGE_ROUTES)).toEqual({ kind: "page", slug: "photography" });
  });

  test("a retired slug keeps its page while a category still uses it", () => {
    expect(resolveSlugRoute("tutor", packagesBefore, PACKAGE_ROUTES)).toEqual({ kind: "page", slug: "tutor" });
  });

  test("a retired slug redirects to its target once no category uses it", () => {
    expect(resolveSlugRoute("tutor", packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "redirect", to: "/packages" });
    expect(resolveSlugRoute("TUTOR", packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "redirect", to: "/packages" });
    expect(resolveSlugRoute("tutor/", packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "redirect", to: "/packages" });
  });

  test("uppercase or trailing-slash variants of a live slug go to the canonical URL", () => {
    expect(resolveSlugRoute("PHOTOGRAPHY", packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "redirect", to: "/packages/photography" });
    expect(resolveSlugRoute("Videography/", packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "redirect", to: "/packages/videography" });
  });

  test("photography is never redirected away and unknown slugs are 404", () => {
    expect(resolveSlugRoute("photography", [], PACKAGE_ROUTES)).toEqual({ kind: "notFound" });
    expect(resolveSlugRoute("no-such-category", packagesAfter, PACKAGE_ROUTES)).toEqual({ kind: "notFound" });
  });
});

test.describe("service route resolver", () => {
  test("before the rename is published, the old service page renders and nothing redirects", () => {
    expect(resolveSlugRoute("packaging-design", servicesBefore, SERVICE_ROUTES)).toEqual({ kind: "page", slug: "packaging-design" });
    expect(resolveSlugRoute("book-cover-design", servicesBefore, SERVICE_ROUTES)).toEqual({ kind: "notFound" });
  });

  test("after the rename is published, the old slug redirects to the new one, any case or trailing slash", () => {
    for (const slug of ["packaging-design", "PACKAGING-DESIGN", "Packaging-Design/"])
      expect(resolveSlugRoute(slug, servicesAfter, SERVICE_ROUTES)).toEqual({ kind: "redirect", to: "/services/book-cover-design" });
    expect(resolveSlugRoute("book-cover-design", servicesAfter, SERVICE_ROUTES)).toEqual({ kind: "page", slug: "book-cover-design" });
  });

  test("the old slug never redirects to a missing page", () => {
    const neither = servicesAfter.filter((slug) => slug !== "book-cover-design");
    expect(resolveSlugRoute("packaging-design", neither, SERVICE_ROUTES)).toEqual({ kind: "notFound" });
  });

  test("stored related slugs resolve to the live service, never to a missing one", () => {
    expect(liveSlugFor("packaging-design", servicesBefore, SERVICE_ROUTES)).toBe("packaging-design");
    expect(liveSlugFor("packaging-design", servicesAfter, SERVICE_ROUTES)).toBe("book-cover-design");
    expect(liveSlugFor("no-such-service", servicesAfter, SERVICE_ROUTES)).toBeNull();
  });
});

test.describe("portfolio category route resolver", () => {
  test("before the rename is published, the old category page renders and nothing redirects", () => {
    expect(resolveSlugRoute("packaging-design", categoriesBefore, CATEGORY_ROUTES)).toEqual({ kind: "page", slug: "packaging-design" });
    expect(resolveSlugRoute("book-cover-design", categoriesBefore, CATEGORY_ROUTES)).toEqual({ kind: "notFound" });
  });

  test("after the rename is published, the old slug redirects to the new one, any case or trailing slash", () => {
    for (const slug of ["packaging-design", "PACKAGING-DESIGN", "Packaging-Design/"])
      expect(resolveSlugRoute(slug, categoriesAfter, CATEGORY_ROUTES)).toEqual({ kind: "redirect", to: "/portfolio/category/book-cover-design" });
    expect(resolveSlugRoute("book-cover-design", categoriesAfter, CATEGORY_ROUTES)).toEqual({ kind: "page", slug: "book-cover-design" });
    expect(resolveSlugRoute("BOOK-COVER-DESIGN", categoriesAfter, CATEGORY_ROUTES)).toEqual({ kind: "redirect", to: "/portfolio/category/book-cover-design" });
  });

  test("the old category slug never redirects to a missing page", () => {
    const neither = categoriesAfter.filter((slug) => slug !== "book-cover-design");
    expect(resolveSlugRoute("packaging-design", neither, CATEGORY_ROUTES)).toEqual({ kind: "notFound" });
    expect(resolveSlugRoute("packaging-design", [], CATEGORY_ROUTES)).toEqual({ kind: "notFound" });
  });
});

test("redirects cannot loop or chain", () => {
  for (const [routes, live] of [[PACKAGE_ROUTES, packagesAfter], [SERVICE_ROUTES, servicesAfter], [CATEGORY_ROUTES, categoriesAfter]] as const) {
    for (const [from, target] of Object.entries(routes.retired)) {
      expect(target).not.toBe(`${routes.basePath}/${from}`);
      const first = resolveSlugRoute(from, live, routes);
      if (first.kind !== "redirect" || !first.to.startsWith(`${routes.basePath}/`)) continue;
      expect(resolveSlugRoute(first.to.slice(routes.basePath.length + 1), live, routes).kind).toBe("page");
    }
  }
});

test.describe("package URLs over HTTP", () => {
  test("a live package page responds 200 without redirecting", async ({ request }) => {
    const response = await request.get("/packages/photography", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("uppercase and trailing-slash URLs redirect permanently to the canonical page", async ({ request }) => {
    const upper = await request.get("/packages/BRANDING", { maxRedirects: 0 });
    expect(upper.status()).toBe(308);
    expect(upper.headers().location).toMatch(/\/packages\/branding$/);
    const slash = await request.get("/packages/branding/", { maxRedirects: 0 });
    expect(slash.status()).toBe(308);
    expect(slash.headers().location).toMatch(/\/packages\/branding$/);
    const final = await request.get("/packages/BRANDING/");
    expect(final.status()).toBe(200);
    expect(final.url()).toMatch(/\/packages\/branding$/);
  });

  test("a retired slug that is still live renders its page (no redirect yet)", async ({ request }) => {
    // Local test data still has a "tutor" category; the redirect only applies once it is renamed.
    const response = await request.get("/packages/tutor", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("an unknown package slug shows the not-found page without redirecting", async ({ page }) => {
    // The streaming root loading.tsx makes not-found pages answer 200 site-wide (a known soft 404).
    const response = await page.goto("/packages/no-such-category");
    expect(response?.request().redirectedFrom()).toBeNull();
    await expect(page.getByRole("heading", { name: "This idea wandered off." })).toBeVisible();
  });
});

test.describe("service URLs over HTTP", () => {
  test("the not-yet-renamed service still renders at its old URL without redirecting", async ({ request }) => {
    // Local test data still has "packaging-design"; the redirect only applies after the rename is published.
    const response = await request.get("/services/packaging-design", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("uppercase service URLs redirect permanently to the canonical page", async ({ request }) => {
    const upper = await request.get("/services/PRINT-ADVERTISING", { maxRedirects: 0 });
    expect(upper.status()).toBe(308);
    expect(upper.headers().location).toMatch(/\/services\/print-advertising$/);
  });
});

test.describe("portfolio category URLs over HTTP", () => {
  test("the not-yet-renamed category still renders at its old URL without redirecting", async ({ request }) => {
    // Local test data still has "packaging-design"; the redirect only applies after the rename is published.
    const response = await request.get("/portfolio/category/packaging-design", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("uppercase category URLs redirect permanently to the canonical page", async ({ request }) => {
    const upper = await request.get("/portfolio/category/PRINT-ADVERTISING", { maxRedirects: 0 });
    expect(upper.status()).toBe(308);
    expect(upper.headers().location).toMatch(/\/portfolio\/category\/print-advertising$/);
  });
});
