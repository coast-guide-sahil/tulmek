import { test, expect } from "@playwright/test";

test.describe("Progress Tracker", () => {
  test.describe("Dashboard", () => {
    test("loads and shows all four sections", async ({ page }) => {
      await page.goto("/progress");
      await expect(page.getByRole("heading", { name: "Progress Tracker" })).toBeVisible();
      await expect(page.getByText("0/690")).toBeVisible();
      await expect(page.getByRole("heading", { name: "DSA" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "High-Level Design" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Low-Level Design" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Behavioral" })).toBeVisible();
    });

    test("shows correct item counts", async ({ page }) => {
      await page.goto("/progress");
      await expect(page.getByText("560 problems across 28 patterns")).toBeVisible();
      await expect(page.getByText("31 systems and concepts")).toBeVisible();
      await expect(page.getByText("49 OOP design problems")).toBeVisible();
      await expect(page.getByText("50 STAR questions across 6 competencies")).toBeVisible();
    });

    test("section cards link to correct pages", async ({ page }) => {
      await page.goto("/progress");
      await page.getByRole("heading", { name: "DSA" }).click();
      await expect(page).toHaveURL(/\/progress\/dsa/);
    });
  });

  test.describe("Navigation", () => {
    test("tab navigation works across all sections", async ({ page }) => {
      await page.goto("/progress");
      const nav = page.getByRole("navigation", { name: "Progress sections" });
      await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "DSA" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "HLD" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "LLD" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Behavioral" })).toBeVisible();
    });

    test("navigating to each section loads correct page", async ({ page }) => {
      await page.goto("/progress");

      await page.getByRole("navigation", { name: "Progress sections" }).getByRole("link", { name: "HLD" }).click();
      await expect(page).toHaveURL(/\/progress\/hld/);
      await expect(page.getByRole("heading", { name: "High-Level Design" })).toBeVisible();

      await page.getByRole("navigation", { name: "Progress sections" }).getByRole("link", { name: "LLD" }).click();
      await expect(page).toHaveURL(/\/progress\/lld/);
      await expect(page.getByRole("heading", { name: "Low-Level Design" })).toBeVisible();

      await page.getByRole("navigation", { name: "Progress sections" }).getByRole("link", { name: "Behavioral" }).click();
      await expect(page).toHaveURL(/\/progress\/behavioral/);
      await expect(page.getByRole("heading", { name: "Behavioral Questions" })).toBeVisible();
    });
  });

  test.describe("DSA Tracker", () => {
    test("shows 560 problems with 28 groups", async ({ page }) => {
      await page.goto("/progress/dsa");
      await expect(page.getByRole("heading", { name: "DSA Problems" })).toBeVisible();
      await expect(page.getByText("0 of 560 completed")).toBeVisible();
      await expect(page.getByText("Arrays & Strings")).toBeVisible();
    });

    test("search filters items", async ({ page }) => {
      await page.goto("/progress/dsa");
      const searchInput = page.getByRole("searchbox", { name: "Search" });
      await searchInput.fill("two sum");
      await expect(page.getByText(/\/560/)).toBeVisible();
    });

    test("difficulty filter chips are visible", async ({ page }) => {
      await page.goto("/progress/dsa");
      await expect(page.getByRole("button", { name: /easy/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /medium/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /hard/ })).toBeVisible();
    });

    test("expanding a group shows problems", async ({ page }) => {
      await page.goto("/progress/dsa");
      await page.getByText("Arrays & Strings").click();
      await expect(page.getByText("Two Sum")).toBeVisible();
    });

    test("checking a problem persists after reload", async ({ page }) => {
      await page.goto("/progress/dsa");
      // Expand group
      await page.getByText("Arrays & Strings").click();
      // Check Two Sum
      const checkbox = page.getByRole("checkbox", { name: /Mark Two Sum/ }).first();
      await checkbox.click();
      await expect(page.getByText("1 of 560 completed")).toBeVisible();

      // Reload and verify persistence
      await page.reload();
      await expect(page.getByText("1 of 560 completed")).toBeVisible();

      // Uncheck to clean up — group auto-opens since it has progress
      const checkboxAfter = page.getByRole("checkbox", { name: /Mark Two Sum/ }).first();
      await checkboxAfter.click();
      await expect(page.getByText("0 of 560 completed")).toBeVisible();
    });

    test("status filter shows done/remaining counts", async ({ page }) => {
      await page.goto("/progress/dsa");
      const statusGroup = page.getByRole("radiogroup", { name: "Filter by status" });
      await expect(statusGroup.getByText("All")).toBeVisible();
      await expect(statusGroup.getByText("Done")).toBeVisible();
      await expect(statusGroup.getByText("Remaining")).toBeVisible();
    });
  });

  test.describe("HLD Tracker", () => {
    test("shows systems grouped by fundamentals and classic", async ({ page }) => {
      await page.goto("/progress/hld");
      await expect(page.getByRole("heading", { name: "High-Level Design" })).toBeVisible();
      await expect(page.getByText("0 of 31 completed")).toBeVisible();
      await expect(page.getByText("Fundamentals")).toBeVisible();
      await expect(page.getByText("Classic Systems")).toBeVisible();
    });
  });

  test.describe("LLD Tracker", () => {
    test("shows problems grouped by tier", async ({ page }) => {
      await page.goto("/progress/lld");
      await expect(page.getByRole("heading", { name: "Low-Level Design" })).toBeVisible();
      await expect(page.getByText("0 of 49 completed")).toBeVisible();
      await expect(page.getByText(/Tier 1/)).toBeVisible();
      await expect(page.getByText(/Tier 2/)).toBeVisible();
    });
  });

  test.describe("Behavioral Tracker", () => {
    test("shows questions grouped by competency", async ({ page }) => {
      await page.goto("/progress/behavioral");
      await expect(page.getByRole("heading", { name: "Behavioral Questions" })).toBeVisible();
      await expect(page.getByText("0 of 50 completed")).toBeVisible();
      await expect(page.getByText("Leadership & Influence")).toBeVisible();
      await expect(page.getByText("Problem Solving")).toBeVisible();
    });
  });

  test.describe("Bulk Select", () => {
    test("select mode shows selection checkboxes", async ({ page }) => {
      await page.goto("/progress/dsa");
      await page.getByRole("button", { name: "Select" }).click();
      await expect(page.getByText("0 selected")).toBeVisible();
      await expect(page.getByText("Select all")).toBeVisible();
      await expect(page.getByText("Clear")).toBeVisible();
    });
  });
});
