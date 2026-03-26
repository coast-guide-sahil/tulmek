import { test, expect } from "@playwright/test";

test.describe("Page navigation", () => {
  test("homepage redirects to progress tracker", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/progress/);
    await expect(
      page.getByRole("heading", { name: "Progress Tracker" }),
    ).toBeVisible();
  });
});
