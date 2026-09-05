import { expect, test } from "@playwright/test";

const profile = { id: "admin", email: "admin@example.test", displayName: "Admin", status: "ACTIVE", roles: ["SUPER_ADMIN"] };
const avatar = { id: "avatar-1", url: "https://res.cloudinary.com/demo/image/upload/avatar.png", secureUrl: "https://res.cloudinary.com/demo/image/upload/avatar.png", title: "avatar.png", altText: "Client photo" };
const testimonial = { id: "t-1", clientName: "Nimal Perera", clientRole: "CEO", quote: "Excellent work", rating: 5, displayOrder: 0, avatarId: avatar.id, avatar, status: "PUBLISHED" };

async function mock(page: import("@playwright/test").Page) {
  let current: Record<string, unknown>[] = [testimonial];
  await page.route("**/api/v1/admin/**", async (route) => {
    const url = new URL(route.request().url()), method = route.request().method();
    if (url.pathname.endsWith("/auth/me")) return route.fulfill({ json: { data: profile } });
    if (url.pathname.endsWith("/cms/testimonials") && method === "GET") return route.fulfill({ json: { data: current } });
    if (url.pathname.endsWith("/cms/media") && method === "GET") return route.fulfill({ json: { data: [avatar] } });
    if (url.pathname.endsWith("/cms/testimonials") && method === "POST") { const data = route.request().postDataJSON().data; const created = { ...testimonial, ...data, id: "t-new" }; current = [created, ...current]; return route.fulfill({ json: { data: created } }); }
    if (url.pathname.includes("/cms/testimonials/") && method === "PATCH") return route.fulfill({ json: { data: testimonial } });
    if (url.pathname.includes("/cms/testimonials/") && method === "DELETE") { current = []; return route.fulfill({ json: { data: { archived: true } } }); }
    if (url.pathname.includes("/publishing/testimonials/") && url.pathname.endsWith("/publish")) return route.fulfill({ json: { data: { published: true, version: 1 } } });
    return route.fulfill({ json: { data: {} } });
  });
}

test("simple testimonial editor supports rating, image, immediate publish, edit and remove", async ({ page }) => {
  await mock(page); page.on("dialog", (dialog) => dialog.accept()); await page.goto("/admin/testimonials");
  await expect(page.getByText("Nimal Perera")).toBeVisible(); await page.getByRole("button", { name: "Add Testimonial" }).click();
  await page.getByLabel("Name").fill("Asha Client"); await page.getByLabel("Position").fill("Founder"); await page.getByLabel("Comment").fill("A wonderful experience"); await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByLabel("Add testimonial").getByRole("button", { name: "Add Testimonial", exact: true }).click(); await expect(page.getByText("Testimonial is now live on the Home page.")).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).first().click(); await expect(page.getByText("Testimonial removed from the Home page.")).toBeVisible();
});
