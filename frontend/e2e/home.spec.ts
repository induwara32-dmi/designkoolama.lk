import { expect, test } from "@playwright/test";

const sizes = [
  { name: "mobile-320", width: 320, height: 900 }, { name: "mobile-375", width: 375, height: 900 }, { name: "mobile-430", width: 430, height: 932 }, { name: "tablet-768", width: 768, height: 1024 }, { name: "laptop-1024", width: 1024, height: 900 }, { name: "desktop-1280", width: 1280, height: 900 }, { name: "desktop-1440", width: 1440, height: 1000 }, { name: "desktop-1920", width: 1920, height: 1080 },
] as const;

for (const size of sizes) {
  test(`home layout at ${size.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(size);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /we turn creative concepts into/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
    for (const section of await page.locator("main > section").all()) {
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `test-results/screenshots/${size.name}.png`, fullPage: true });
  });
}

test("mobile navigation is keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" }); await toggle.click(); await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeHidden();
});

test("quote form exposes validation errors", async ({ page }) => {
  await page.goto("/"); await page.getByRole("button", { name: "Submit Request" }).click(); await expect(page.getByText("Enter your full name")).toBeVisible(); await expect(page.getByText("Enter a valid email address")).toBeVisible();
});
