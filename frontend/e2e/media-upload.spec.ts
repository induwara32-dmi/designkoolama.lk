import { expect, test, type Page } from "@playwright/test";

const profile = { id: "media-admin", email: "admin@example.test", displayName: "Media Admin", status: "ACTIVE", lastLoginAt: null, roles: ["SUPER_ADMIN"] };
const category = { id: "category-branding", slug: "branding-and-identity", name: "Branding & Identity", cardTitle:"Branding & Identity",description:"Branding card description",shortDescription:"Branding category description",overview:"Branding category overview",iconKey:"flame",displayOrder:0,isActive: true,status:"PUBLISHED",publishedSnapshot:{technical:"must stay hidden"},galleryImages:[] };
const service = { id: "service-branding", slug: "brand-identity", name: "Brand Identity" };
const asset = { id: "asset-new", providerId: "designkoolama/test/asset", url: "https://res.cloudinary.com/demo/image/upload/asset.png", secureUrl: "https://res.cloudinary.com/demo/image/upload/asset.png", title: "sample.png", altText: "Orange sample", caption: "Test caption", mimeType: "image/png", bytes: 68, width: 1, height: 1 };
const asset2={...asset,id:"asset-second",providerId:"designkoolama/test/second",title:"second.png",altText:"Second image"};
const asset3={...asset,id:"asset-third",providerId:"designkoolama/test/third",title:"third.png",altText:"Third image"};
const existingProject = { id: "project-1", title: "Project", slug: "project", categoryId: category.id, serviceId: service.id, clientName: "Client", summary: "Summary", displayOrder: 0, content: {}, media: [{ mediaId: asset.id, displayOrder: 0, media: asset }] };
type MockState = { createPayload?: Record<string, unknown>; updatePayload?: Record<string, unknown>; categoryPayload?:Record<string,unknown>; published: boolean; project: typeof existingProject; uploadCount:number };

async function mockPortfolio(page: Page, initialProject = existingProject) {
  const state: MockState = { published: false, project: initialProject, uploadCount:0 };
  await page.route("**/api/v1/admin/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname.endsWith("/auth/me")) return route.fulfill({ json: { data: profile } });
    if (url.pathname.endsWith("/cms/media/upload") && method === "POST") { const uploaded=[asset,asset2,asset3][state.uploadCount++ % 3]; return route.fulfill({ json: { data: uploaded } }); }
    if (url.pathname.endsWith("/cms/media") && method === "GET") return route.fulfill({ json: { data: [asset,asset2,asset3] } });
    if (url.pathname.endsWith("/cms/portfolio-categories") && method === "GET") return route.fulfill({ json: { data: [category] } });
    if(url.pathname.includes("/cms/portfolio-categories/")&&method==="PATCH"){state.categoryPayload=route.request().postDataJSON().data as Record<string,unknown>;const gallery=Array.isArray(state.categoryPayload.galleryImages)?state.categoryPayload.galleryImages as Record<string,unknown>[]:[];return route.fulfill({json:{data:{...category,...state.categoryPayload,galleryImages:gallery.map((entry)=>({...entry,media:asset}))}}})}
    if (url.pathname.endsWith("/cms/services") && method === "GET") return route.fulfill({ json: { data: [service] } });
    if (url.pathname.endsWith("/cms/portfolio") && method === "GET") return route.fulfill({ json: { data: [state.project] } });
    if (url.pathname.endsWith("/cms/portfolio") && method === "POST") {
      state.createPayload = route.request().postDataJSON().data as Record<string, unknown>;
      state.project = { ...existingProject, id: "project-created", title: String(state.createPayload.title), slug: String(state.createPayload.slug), categoryId: String(state.createPayload.categoryId), serviceId: String(state.createPayload.serviceId), clientName: String(state.createPayload.clientName), summary: String(state.createPayload.summary), media: [{ mediaId: asset.id, displayOrder: 0, media: asset }] };
      return route.fulfill({ json: { data: state.project } });
    }
    if (url.pathname.includes("/cms/portfolio/") && method === "PATCH") {
      state.updatePayload = route.request().postDataJSON().data as Record<string, unknown>;
      return route.fulfill({ json: { data: state.project } });
    }
    if (url.pathname.includes("/publishing/portfolio/") && url.pathname.endsWith("/publish")) {
      state.published = true;
      return route.fulfill({ json: { data: { published: true, version: 2 } } });
    }
    if(url.pathname.includes("/publishing/portfolio-categories/")&&url.pathname.endsWith("/publish")){state.published=true;return route.fulfill({json:{data:{published:true,version:2}}})}
    return route.fulfill({ json: { data: {} } });
  });
  return state;
}

test("Media Library exposes accessible upload validation and preview", async ({ page }) => {
  await mockPortfolio(page); await page.goto("/admin/media"); await page.getByRole("button", { name: "Upload Image" }).click();
  await expect(page.getByLabel("Alternative text")).toBeVisible();
  await page.getByLabel("Choose an image from your computer").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", "base64") });
  await expect(page.getByAltText("Selected image preview")).toBeVisible(); await page.getByRole("button", { name: "Upload Image", exact: true }).last().click();
  await expect(page.getByLabel("Alternative text")).toHaveAttribute("required", "");
});

test("successful upload appears immediately in the Media Library", async ({ page }) => {
  await mockPortfolio(page); await page.goto("/admin/media"); await page.getByRole("button", { name: "Upload Image" }).click();
  await page.getByLabel("Choose an image from your computer").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", "base64") });
  await page.getByLabel("Alternative text").fill("Orange sample"); await page.getByLabel("Caption (optional)").fill("Test caption"); await page.getByRole("button", { name: "Upload Image", exact: true }).last().click();
  await expect(page.getByText("Image uploaded and added to the Media Library.")).toBeVisible(); await expect(page.getByRole("button", { name: /sample.png/ })).toBeVisible();
});

test("a non-technical admin can create, categorize, illustrate, publish, and reopen a portfolio project", async ({ page }) => {
  const state = await mockPortfolio(page); page.on("dialog", (dialog) => dialog.accept()); await page.goto("/admin/portfolio");
  await page.getByRole("button", { name: "Add Portfolio Project" }).click(); await page.getByLabel("Title").fill("Client launch"); await page.getByLabel("Slug").fill("client-launch");
  await page.getByLabel("Category").selectOption({ label: "Branding & Identity" }); await page.getByLabel("Related service (optional)").selectOption({ label: "Brand Identity" });
  await page.getByLabel("Client name").fill("Acme Client"); await page.getByLabel("Summary").fill("A clear portfolio summary"); await page.getByRole("button", { name: "Upload Image" }).click();
  await page.getByLabel("Choose project image").setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", "base64") }); await page.getByLabel("Alternative text").fill("Orange sample"); await page.getByLabel("Caption (optional)").fill("Launch cover"); await page.getByRole("button", { name: "Upload and select image" }).click();
  await expect(page.getByText("Image uploaded and selected. Save the draft when you are ready.")).toBeVisible(); await expect(page.getByRole("list", { name: "Selected project images" }).getByText("Cover image")).toBeVisible(); await expect(page.getByLabel("Title")).toHaveValue("Client launch");
  await page.getByRole("button", { name: "Save draft" }).click(); expect(state.createPayload).toMatchObject({ categoryId: category.id, serviceId: service.id, clientName: "Acme Client", mediaIds: [asset.id] }); expect(state.published).toBe(false);
  await page.getByRole("button", { name: "Publish", exact: true }).click(); await expect.poll(() => state.published).toBe(true); await page.getByRole("button", { name: "Close editor" }).click(); await page.getByRole("button", { name: /Client launch/ }).click();
  await expect(page.getByLabel("Category")).toHaveValue(category.id); await expect(page.getByLabel("Related service (optional)")).toHaveValue(service.id); await expect(page.getByRole("list", { name: "Selected project images" }).getByText("Cover image")).toBeVisible();
});

test("existing project category and ordered image selection are restored and saved as a draft", async ({ page }) => {
  const state = await mockPortfolio(page); await page.goto("/admin/portfolio"); await page.getByRole("button", { name: /^Project/ }).click();
  await expect(page.getByLabel("Category")).toHaveValue(category.id); await expect(page.getByRole("list", { name: "Selected project images" }).getByText("Cover image")).toBeVisible(); await page.getByRole("button", { name: "Save draft" }).click();
  expect(state.updatePayload).toMatchObject({ categoryId: category.id, serviceId: service.id, mediaIds: [asset.id] }); expect(state.published).toBe(false);
});

test("portfolio image picker remains usable without horizontal overflow on mobile", async ({ page }) => {
  await mockPortfolio(page); await page.setViewportSize({ width: 320, height: 900 }); await page.goto("/admin/portfolio"); await page.getByRole("button", { name: /^Project/ }).click();
  await expect(page.getByRole("button", { name: "Upload Image" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("category Manage opens simple content controls without raw JSON", async ({page})=>{
  await mockPortfolio(page);
  await page.goto("/admin/portfolio-categories");
  await expect(page.getByText("publishedSnapshot")).toHaveCount(0);
  await page.getByRole("button",{name:"Manage"}).click();
  await expect(page.getByRole("heading",{name:"Branding & Identity"})).toBeVisible();
  await expect(page.getByLabel("Short description")).toBeVisible();
  await expect(page.getByLabel("Overview")).toBeVisible();
  await expect(page.getByText("publishedSnapshot")).toHaveCount(0);
});

test("admin uploads, replaces, and removes banner and multiple gallery images directly",async({page})=>{
  const state=await mockPortfolio(page);page.on("dialog",dialog=>dialog.accept());await page.goto("/admin/portfolio-categories");await page.getByRole("button",{name:"Manage"}).click();
  const png={name:"brand-banner.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB","base64")};
  await page.getByText("Add Banner Image").locator("input").setInputFiles(png);await expect(page.getByText("sample.png")).toBeVisible();
  await page.getByText("Change Banner").locator("input").setInputFiles({...png,name:"replacement.png"});await expect(page.getByText("second.png")).toBeVisible();
  await page.getByText("Add Gallery Images").locator("input").setInputFiles([{...png,name:"one.png"},{...png,name:"two.png"}]);
  await expect(page.locator(".admin-simple-gallery li")).toHaveCount(2);
  await page.getByRole("button",{name:"Remove",exact:true}).first().click();await expect(page.locator(".admin-simple-gallery li")).toHaveCount(1);
  await page.getByText("Add Gallery Images").locator("input").setInputFiles({...png,name:"three.png"});await expect(page.locator(".admin-simple-gallery li")).toHaveCount(2);
  await page.getByRole("button",{name:"Save Changes"}).click();expect(state.categoryPayload).toMatchObject({bannerMediaId:asset2.id,bannerAltText:"Branding & Identity banner"});expect(state.categoryPayload?.galleryImages).toHaveLength(2);expect(state.published).toBe(false);
  await page.getByRole("button",{name:"Publish Changes"}).click();await expect.poll(()=>state.published).toBe(true);
  await page.getByRole("button",{name:"Remove Banner"}).click();await page.getByRole("button",{name:"Save Changes"}).click();expect(state.categoryPayload).toMatchObject({bannerMediaId:"",bannerAltText:"",bannerCaption:""});
});

test("admin manages one shared category card image", async ({ page }) => {
  const state = await mockPortfolio(page); page.on("dialog", (dialog) => dialog.accept()); await page.goto("/admin/portfolio-categories"); await page.getByRole("button", { name: "Manage" }).click();
  const png = { name: "card.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", "base64") };
  await page.getByText("Add Card Image").locator("input").setInputFiles(png); await expect(page.getByText("sample.png")).toBeVisible();
  await page.getByRole("button", { name: "Save Changes" }).click(); expect(state.categoryPayload).toMatchObject({ cardMediaId: asset.id });
  await page.getByRole("button", { name: "Remove Image" }).click(); await page.getByRole("button", { name: "Save Changes" }).click(); expect(state.categoryPayload).toMatchObject({ cardMediaId: "" });
});

for(const width of [320,768,1440])test(`simple category manager has no overflow at ${width}px`,async({page})=>{await mockPortfolio(page);await page.setViewportSize({width,height:900});await page.goto("/admin/portfolio-categories");await page.getByRole("button",{name:"Manage"}).click();const result=await page.evaluate(()=>({fits:document.documentElement.scrollWidth<=window.innerWidth,scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,wide:[...document.querySelectorAll<HTMLElement>("body *")].filter(element=>element.getBoundingClientRect().right>window.innerWidth+1).slice(0,5).map(element=>({tag:element.tagName,className:element.className,right:Math.round(element.getBoundingClientRect().right),width:Math.round(element.getBoundingClientRect().width)}))}));expect(result.fits,JSON.stringify(result)).toBe(true)});
