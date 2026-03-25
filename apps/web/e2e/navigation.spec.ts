import { test, expect } from "@playwright/test";

test.describe("Page navigation", () => {
  test("homepage loads and shows welcome content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    // Unauthenticated users see "Welcome, Guest"
    await expect(page.getByText("Welcome, Guest")).toBeVisible();
  });

  test("homepage has sign in and sign up links in main content", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("main").getByRole("link", { name: "Sign In" }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Sign Up" }),
    ).toBeVisible();
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
    // Sign-up page should have some visible content
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/sign up/i).first()).toBeVisible();
  });

  test("can navigate from homepage to sign-in", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Sign In" })
      .click();
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });
});
