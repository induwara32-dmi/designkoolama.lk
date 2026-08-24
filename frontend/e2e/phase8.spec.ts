import { expect, test, type Page } from "@playwright/test";

const profile = { id: "publisher", email: "publisher@example.test", displayName: "Publisher", status: "ACTIVE", lastLoginAt: null, roles: ["SUPER_ADMIN"] };
const record = { id: "service-1", name: "Brand identity", slug: "brand-identity", summary: "Draft summary", status: "DRAFT", displayOrder: 1, content: { hero: "Draft hero" }, publishedSnapshot: { content: { hero: "Live hero" } } };

async function mockPublishing(page: Page) {
  await page.route("**/api/v1/admin/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname.endsWith("/auth/me")) return route.fulfill({ json: { data: profile } });
    if (url.pathname.includes("/publishing/") && url.pathname.endsWith("/preview")) return route.fulfill({ json: { data: { path: "/preview/services/service-1?token=signed-test-context", expiresInSeconds: 900 } } });
    if (url.pathname.includes("/publishing/") && url.pathname.endsWith("/publish")) return route.fulfill({ json: { data: { published: true, version: 2 } } });
    if (url.pathname.includes("/publishing/") && url.pathname.endsWith("/unpublish")) return route.fulfill({ json: { data: { unpublished: true } } });
    if (url.pathname.includes("/publishing/") && url.pathname.endsWith("/revisions")) return route.fulfill({ json: { data: [{ id: "revision-2", version: 2, createdAt: new Date().toISOString(), publishedAt: new Date().toISOString(), createdBy: { displayName: "Publisher" }, publishedBy: { displayName: "Publisher" } }] } });
    if (url.pathname.includes("/cms/services")) {
      if (method === "GET") return route.fulfill({ json: { data: [record] } });
      if (method === "PATCH") return route.fulfill({ json: { data: { ...record, status: "DRAFT" } } });
      return route.fulfill({ json: { data: record } });
    }
    return route.fulfill({ json: { data: {} } });
  });
}

async function openEditor(page: Page) {
  await mockPublishing(page);
  await page.goto("/admin/services");
  await page.getByRole("button", { name: /Brand identity/ }).click();
  await expect(page.getByRole("heading", { name: "Edit record" })).toBeVisible();
}

test("editing content saves a draft without a publish status override", async ({ page }) => {
  await openEditor(page);
  await page.getByLabel("Summary").fill("Updated draft summary");
  const request = page.waitForRequest((value) => value.method() === "PATCH" && value.url().includes("/cms/services/service-1"));
  await page.getByRole("button", { name: "Save draft" }).click();
  const body = (await request).postDataJSON();
  expect(body.data.summary).toBe("Updated draft summary");
  expect(body.data).not.toHaveProperty("status");
});

test("explicit publish requires confirmation and reports the revision", async ({ page }) => {
  await openEditor(page);
  page.on("dialog", (dialog) => dialog.accept());
  const request = page.waitForRequest((value) => value.method() === "POST" && value.url().endsWith("/publish"));
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await request;
  await expect(page.locator("p.admin-success[role=status]")).toContainText("Version 2 is now live");
});

test("unpublish is an explicit confirmed action", async ({ page }) => {
  await openEditor(page);
  page.on("dialog", (dialog) => dialog.accept());
  const request = page.waitForRequest((value) => value.method() === "POST" && value.url().endsWith("/unpublish"));
  await page.getByRole("button", { name: "Unpublish" }).click();
  await request;
  await expect(page.locator("p.admin-success[role=status]")).toContainText("no longer public");
});

test("preview opens only the signed short-lived path", async ({ page, context }) => {
  await openEditor(page);
  const opened = context.waitForEvent("page");
  await page.getByRole("button", { name: "Preview draft" }).click();
  const preview = await opened;
  await expect(preview).toHaveURL(/\/preview\/services\/service-1\?token=/);
  expect(new URL(preview.url()).searchParams.get("token")).toBe("signed-test-context");
});

test("preview routes are excluded from the sitemap", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/preview/");
});

test("publication history exposes immutable version numbers", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByRole("list", { name: "Publication history" })).toContainText("Version 2");
});

for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) test(`publishing controls have no overflow at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await openEditor(page);
  await expect(page.getByRole("button", { name: "Preview draft" })).toBeVisible();
  await expect(page.locator(".admin-cms-editor")).toHaveCSS("opacity", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  if ([320, 768, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`phase8-publishing-${width}.png`), fullPage: true });
});
