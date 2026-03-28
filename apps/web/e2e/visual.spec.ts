import { test, expect } from "@playwright/test";

/**
 * Visual regression tests — captures screenshots and compares against baselines.
 * Run `npx playwright test --update-snapshots` to update baselines.
 * Only run in CI (consistent Linux environment avoids OS-dependent pixel diffs).
 */

test.describe("Visual Regression", () => {
  test("hub page layout", async ({ page }) => {
    await page.goto("/hub");
    await page.waitForLoadState("networkidle");

    // Freeze dynamic content for consistent snapshots
    await page.evaluate(() => {
      document.querySelectorAll("[class*='live-pulse']").forEach((el) => {
        (el as HTMLElement).style.animation = "none";
      });
      document.querySelectorAll("[class*='animate']").forEach((el) => {
        (el as HTMLElement).style.animation = "none";
      });
    });

    await expect(page).toHaveScreenshot("hub-page.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test("company page layout", async ({ page }) => {
    await page.goto("/hub/company/google");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("company-google.png", {
      maxDiffPixelRatio: 0.02,
      fullPage: false,
    });
  });

  test("404 page layout", async ({ page }) => {
    await page.goto("/nonexistent");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("404-page.png", {
      maxDiffPixelRatio: 0.01,
      fullPage: true,
    });
  });
});
