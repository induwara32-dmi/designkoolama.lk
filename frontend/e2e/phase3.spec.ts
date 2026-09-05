import { expect, test, type Page, type TestInfo } from "@playwright/test";

const widths = [320, 375, 430, 768, 1024, 1280, 1440, 1920] as const;
const routes = [
  { name: "about", path: "/about", heading: /Designing Brands That/i },
  { name: "contact", path: "/contact", heading: /Contact Us/i },
  { name: "quote", path: "/get-a-quote", heading: /Get a Quote/i },
  { name: "portfolio", path: "/portfolio", heading: /Our Portfolio/i },
] as const;

async function revealAndCapture(
  page: Page,
  name: string,
  width: number,
  testInfo: TestInfo,
) {
  for (const section of await page.locator("main > section").all()) {
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: testInfo.outputPath(`phase3-${name}-${width}.png`),
    fullPage: true,
  });
}

for (const route of routes) {
  for (const width of widths) {
    test(`${route.name} at ${width}px`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: width < 768 ? 900 : 1000 });
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: route.heading }).first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      ).toBe(false);
      expect(errors).toEqual([]);
      await revealAndCapture(page, route.name, width, testInfo);
    });
  }
}

test("contact form validation and FAQ", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send Message" }).click();
  await expect(page.getByText("Enter your full name").first()).toBeVisible();
  const second = page.getByRole("button", {
    name: "Do you work with international clients?",
  });
  await second.click();
  await expect(second).toHaveAttribute("aria-expanded", "true");
});
test("quote validates and explains deferred attachments", async ({ page }) => {
  await page.goto("/get-a-quote");
  await expect(
    page.getByText(/Attachment uploads are deferred/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit Request" }).click();
  await expect(page.getByText("Choose a service")).toBeVisible();
});
test("portfolio category navigation opens the category gallery", async ({
  page,
}) => {
  await page.goto("/portfolio");
  const categoryLink = page.getByRole("link", { name: /Explore More/ }).last();
  await expect(categoryLink).toHaveAttribute(
    "href",
    "/portfolio/category/3d-design",
  );
  await categoryLink.click();
  await expect(page).toHaveURL(/\/portfolio\/category\/3d-design/);
  await expect(
    page.getByRole("heading", { name: "3D Design", level: 1 }),
  ).toBeVisible();
});
test("portfolio renders exactly the six published category cards", async ({
  page,
}) => {
  await page.goto("/portfolio");
  await expect(page.getByText("Content temporarily unavailable")).toHaveCount(
    0,
  );
  await expect(page.locator(".portfolio-list-card")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "Branding & Identity" }),
  ).toBeVisible();
});
test("home Featured Work reuses published category cards and cycles without project copy", async ({ page }) => {
  await page.goto("/");
  const carousel = page.locator(".featured-work-carousel");
  await expect(carousel).toBeVisible();
  await expect(carousel.locator(".featured-work-card")).toHaveCount(3);
  await expect(page.getByText(/Nova Corp|LuxuryBay|Alto/)).toHaveCount(0);
  await expect(carousel.getByRole("link", { name: /View Branding & Identity portfolio/ })).toBeVisible();
  await expect(carousel.getByRole("tab")).toHaveCount(2);
  await page.waitForTimeout(2200);
  await expect(carousel.getByRole("link", { name: /View Packaging Design portfolio/ })).toBeVisible();
  await expect(carousel.locator(".featured-work-card")).toHaveCount(3);
  await carousel.getByRole("tab", { name: "Show Featured Work page 1" }).click();
  await expect(carousel.getByRole("link", { name: /View Branding & Identity portfolio/ })).toBeVisible();
});
for (const width of [320, 768, 1920]) test(`home Featured Work has no overflow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await expect(page.locator(".featured-work-carousel")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator(".featured-work-card")).toHaveCount(width < 768 ? 1 : width < 1024 ? 2 : 3);
});
test("invalid portfolio slug returns custom not found", async ({ page }) => {
  await page.goto("/portfolio/not-a-project");
  await expect(
    page.getByRole("heading", { name: "This idea wandered off." }),
  ).toBeVisible();
});
test("internal mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeHidden();
});
