import { test, expect } from "@playwright/test";

test.describe("Page navigation", () => {
  test("homepage redirects to knowledge hub", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/hub/);
    await expect(
      page.getByRole("heading", { name: "Knowledge Hub" }),
    ).toBeVisible();
  });

  test("can navigate from hub to progress tracker", async ({ page }) => {
    await page.goto("/hub");
    const nav = page.getByRole("navigation", { name: "Hub sections" });
    await nav.getByRole("link", { name: "Practice" }).click();
    await expect(page).toHaveURL(/\/progress/);
    await expect(
      page.getByRole("heading", { name: "Progress Tracker" }),
    ).toBeVisible();
  });
});
