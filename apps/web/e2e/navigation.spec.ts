import { test, expect } from "@playwright/test";

test.describe("Page navigation", () => {
  test("homepage redirects to progress tracker", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/progress/);
    await expect(page.getByRole("heading", { name: "Progress Tracker" })).toBeVisible();
  });

  test("sign-in page loads with form fields", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  });

  test("sign-in page has link to sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText("Create an account")).toBeVisible();
  });
});
