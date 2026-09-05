import { expect, test } from "@playwright/test";

test.use({ trace: "off", screenshot: "off", video: "off" });

test("real Admin creates and publishes a categorized portfolio draft without an internal error", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL;
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD;
  test.skip(!email || !password, "Live Admin credentials are not configured");

  const unique = Date.now().toString(36);
  const title = `Portfolio verification ${unique}`;
  const imageName = `portfolio-verification-${unique}.png`;
  let created = false;

  await page.goto("http://localhost:3000/admin/login");
  await page.getByLabel("Email address").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  await page.goto("http://localhost:3000/admin/portfolio");
  const projectSearch = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/admin/cms/portfolio") &&
      url.searchParams.get("search") === "Portfolio verification"
    );
  });
  await page.getByPlaceholder("Search records").fill("Portfolio verification");
  await projectSearch;
  const staleProjects = page.getByRole("button", {
    name: /Portfolio verification /,
  });
  while ((await staleProjects.count()) > 0) {
    await staleProjects
      .first()
      .evaluate((element) => (element as HTMLButtonElement).click());
    const removeButtons = page.getByRole("button", {
      name: "Remove from project",
    });
    while ((await removeButtons.count()) > 0)
      await removeButtons.first().click();
    await page.getByRole("button", { name: "Save draft" }).click();
    if ((await page.getByRole("button", { name: "Unpublish" }).count()) > 0) {
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Unpublish" }).click();
    }
    page.once("dialog", (dialog) => dialog.accept());
    const reloadedProjects = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/admin/cms/portfolio?search="),
    );
    await page.getByRole("button", { name: "Archive" }).click();
    await reloadedProjects;
  }
  await page.goto("http://localhost:3000/admin/media");
  const mediaSearch = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/admin/cms/media") &&
      url.searchParams.get("search") === "portfolio-verification"
    );
  });
  await page.getByPlaceholder("Search records").fill("portfolio-verification");
  await mediaSearch;
  const staleMedia = page.getByRole("button", {
    name: /portfolio-verification-/,
  });
  while ((await staleMedia.count()) > 0) {
    await staleMedia
      .first()
      .evaluate((element) => (element as HTMLButtonElement).click());
    page.once("dialog", (dialog) => dialog.accept());
    const reloadedMedia = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/admin/cms/media?search="),
    );
    await page.getByRole("button", { name: "Archive" }).click();
    await reloadedMedia;
  }
  await page.goto("http://localhost:3000/admin/portfolio");
  await page.getByRole("button", { name: "Add Portfolio Project" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Title").press("Tab");
  await expect(page.getByLabel("Slug")).toHaveValue(
    `portfolio-verification-${unique}`,
  );
  await page.getByLabel("Slug").fill("nexus-rebrand");
  await page
    .getByLabel("Category")
    .selectOption({ label: "Branding & Identity" });
  await page.getByLabel("Client name").fill("Local verification client");
  await page
    .getByLabel("Summary")
    .fill("A disposable local verification project for the Admin workflow.");
  await page.getByRole("button", { name: "Upload Image" }).first().click();
  await page.getByLabel("Choose project image").setInputFiles({
    name: imageName,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByLabel("Alternative text")
    .fill("Orange Portfolio verification image");
  await page.getByRole("button", { name: "Upload and select image" }).click();
  await expect(page.getByText("Image uploaded and selected.")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("p.admin-error")).toContainText(
    "This project URL already exists. Please choose another slug.",
  );
  await expect(page.getByLabel("Title")).toHaveValue(title);
  await page.getByLabel("Slug").fill(`portfolio-verification-${unique}`);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator("p.admin-error")).toHaveCount(0);
  await expect(page.locator("p.admin-success[role=status]")).toContainText(
    "Changes saved",
  );
  created = true;

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator("p.admin-success[role=status]")).toContainText(
    "now live",
  );

  await page.goto(
    `http://localhost:3000/portfolio/category/branding-and-identity`,
  );
  await expect(page.getByRole("heading", { name: "Branding & Identity", level: 1 })).toBeVisible();
  await expect(
    page.getByAltText("Orange Portfolio verification image").first(),
  ).toBeVisible();

  await page.goto("http://localhost:3000/portfolio");
  await expect(page.locator(".portfolio-list-card")).toHaveCount(6);
  await expect(
    page
      .locator(".portfolio-list-card")
      .filter({
        has: page.getByRole("heading", { name: "Branding & Identity" }),
      })
      .getByRole("link", { name: /Explore More/ }),
  ).toHaveAttribute("href", "/portfolio/category/branding-and-identity");

  await page.goto("http://localhost:3000/admin/portfolio");
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(page.getByLabel("Category")).toHaveValue(/.+/);
  await expect(
    page
      .getByRole("list", { name: "Selected project images" })
      .getByText("Cover image"),
  ).toBeVisible();

  if (created) {
    await page.getByRole("button", { name: "Remove from project" }).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Unpublish" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Archive" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit record" }),
    ).toHaveCount(0);
    await page.goto("http://localhost:3000/admin/media");
    await page.getByRole("button", { name: new RegExp(imageName) }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Archive" }).click();
  }
});
