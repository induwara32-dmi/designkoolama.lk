import { expect, test } from "@playwright/test";

test("representative public routes render without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/about", "/contact", "/portfolio", "/services/brand-identity", "/packages/tutor"]) {
    await page.goto(path);
    await expect(page.locator("#main-content")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("forms retain accessible validation in production", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByText("Enter your full name").first()).toBeVisible();
  await expect(page.locator('input[aria-invalid="true"]').first()).toBeVisible();
});

test("private routes remain noindex and outside public chrome", async ({ page, request }) => {
  await page.goto("/admin/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("header, footer")).toHaveCount(0);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/admin/");
  expect(sitemap).not.toContain("/preview/");
});

test("production response headers remain hardened", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["x-powered-by"]).toBeUndefined();
});

for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`production layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 812 : 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  });
}
