import { expect, test } from "@playwright/test";

test("home exposes valid organization and website structured data", async ({ page }) => {
  await page.goto("/");
  const entries = await page.locator('script[type="application/ld+json"]').allTextContents();
  const graph = entries.flatMap((entry) => {
    const parsed: unknown = JSON.parse(entry);
    return Array.isArray(parsed) ? parsed : [parsed];
  }) as Array<Record<string, unknown>>;
  expect(graph.some((item) => item["@type"] === "ProfessionalService")).toBeTruthy();
  expect(graph.some((item) => item["@type"] === "WebSite")).toBeTruthy();
});

test("service and case study expose page-specific structured data", async ({ page }) => {
  await page.goto("/services/brand-identity");
  const serviceTypes = await page.locator('script[type="application/ld+json"]').allTextContents().then((entries) => entries.flatMap((entry) => {
    const parsed: unknown = JSON.parse(entry);
    return (Array.isArray(parsed) ? parsed : [parsed]).map((item) => (item as Record<string, unknown>)["@type"]);
  }));
  expect(serviceTypes).toEqual(expect.arrayContaining(["Service", "BreadcrumbList"]));
  await page.goto("/portfolio/nexus-rebrand");
  const projectTypes = await page.locator('script[type="application/ld+json"]').allTextContents().then((entries) => entries.flatMap((entry) => {
    const parsed: unknown = JSON.parse(entry);
    return (Array.isArray(parsed) ? parsed : [parsed]).map((item) => (item as Record<string, unknown>)["@type"]);
  }));
  expect(projectTypes).toEqual(expect.arrayContaining(["CreativeWork", "BreadcrumbList"]));
});

test("public metadata is indexable and canonical while private routes stay excluded", async ({ page, request }) => {
  await page.goto("/about");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/about$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /About DesignKoolama/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin/");
  expect(robots).toContain("Disallow: /preview/");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/admin/");
  expect(sitemap).not.toContain("/preview/");
});

test("skip link moves keyboard focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("mobile navigation is keyboard operable and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Home", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("reduced motion preserves visible content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /we turn creative/i })).toBeVisible();
  const duration = await page.locator(".service-card").first().evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(["0.01ms", "1e-05s"]).toContain(duration);
});

test("responses include Phase 9 delivery security headers", async ({ request }) => {
  const response = await request.get("/");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["permissions-policy"]).toContain("camera=()");
  expect(response.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`Phase 9 public quality layer has no overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  });
}
