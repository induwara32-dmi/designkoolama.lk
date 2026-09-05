import { expect, test } from "@playwright/test";

const categories = [
  ["Branding & Identity", "branding-and-identity"],
  ["Print Advertising", "print-advertising"],
  ["Social Media Design", "social-media-design"],
  ["Packaging Design", "packaging-design"],
  ["Merchandise Design", "merchandise-design"],
  ["3D Design", "3d-design"],
] as const;

test("main Portfolio page contains exactly six category cards", async ({page}) => {
  await page.goto("/portfolio");
  await expect(page.locator(".portfolio-list-card")).toHaveCount(6);
  for(const [name,slug] of categories) {
    const card=page.locator(".portfolio-list-card").filter({has:page.getByRole("heading",{name})});
    await expect(card.getByRole("link",{name:/Explore More/})).toHaveAttribute("href",`/portfolio/category/${slug}`);
  }
});

test("category page is category-level and contains no project navigation",async({page})=>{
  await page.goto("/portfolio/category/branding-and-identity");
  await expect(page).toHaveURL(/\/portfolio\/category\/branding-and-identity$/);
  await expect(page.getByRole("heading",{name:"Branding & Identity",level:1})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Branding & Identity Overview"})).toBeVisible();
  await expect(page.getByText("Branding & Identity Gallery")).toBeVisible();
  await expect(page.getByText(/View case study|Previous project|Next project/)).toHaveCount(0);
});

for(const width of [320,375,430,768,1024,1280,1440,1920]) test(`category page has no horizontal overflow at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto("/portfolio/category/branding-and-identity");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
