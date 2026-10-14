import { expect, test } from "@playwright/test";
import { RETIRED_PACKAGE_SLUGS, resolvePackageRoute } from "../src/lib/package-route";

const afterRename = ["videography", "branding", "photography"];
const beforeRename = ["photography", "branding", "tutor"];

test.describe("package route resolver", () => {
  test("live slugs render their page and never redirect", () => {
    for (const slug of afterRename) expect(resolvePackageRoute(slug, afterRename)).toEqual({ kind: "page", slug });
    expect(resolvePackageRoute("photography", beforeRename)).toEqual({ kind: "page", slug: "photography" });
  });

  test("a retired slug keeps its page while a category still uses it", () => {
    expect(resolvePackageRoute("tutor", beforeRename)).toEqual({ kind: "page", slug: "tutor" });
  });

  test("a retired slug redirects to its target once no category uses it", () => {
    expect(resolvePackageRoute("tutor", afterRename)).toEqual({ kind: "redirect", to: "/packages" });
    expect(resolvePackageRoute("TUTOR", afterRename)).toEqual({ kind: "redirect", to: "/packages" });
    expect(resolvePackageRoute("tutor/", afterRename)).toEqual({ kind: "redirect", to: "/packages" });
  });

  test("uppercase or trailing-slash variants of a live slug go to the canonical URL", () => {
    expect(resolvePackageRoute("PHOTOGRAPHY", afterRename)).toEqual({ kind: "redirect", to: "/packages/photography" });
    expect(resolvePackageRoute("Videography/", afterRename)).toEqual({ kind: "redirect", to: "/packages/videography" });
  });

  test("photography is never redirected away and unknown slugs are 404", () => {
    expect(resolvePackageRoute("photography", [])).toEqual({ kind: "notFound" });
    expect(resolvePackageRoute("no-such-category", afterRename)).toEqual({ kind: "notFound" });
  });

  test("redirects cannot loop", () => {
    for (const target of Object.values(RETIRED_PACKAGE_SLUGS)) expect(target.startsWith("/packages/")).toBe(false);
    for (const slug of ["tutor", "TUTOR", "PHOTOGRAPHY", "Branding/"]) {
      const first = resolvePackageRoute(slug, afterRename);
      if (first.kind !== "redirect" || !first.to.startsWith("/packages/")) continue;
      expect(resolvePackageRoute(first.to.slice("/packages/".length), afterRename).kind).toBe("page");
    }
  });
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
