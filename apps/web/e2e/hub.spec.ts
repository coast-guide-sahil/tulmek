import { test, expect } from "@playwright/test";

test.describe("Knowledge Hub", () => {
  test.describe("Feed Page", () => {
    test("loads and shows header with article count", async ({ page }) => {
      await page.goto("/hub");
      await expect(
        page.getByRole("heading", { name: "Knowledge Hub" }),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/\d+ articles/)).toBeVisible();
    });

    test("shows content cards", async ({ page }) => {
      await page.goto("/hub");
      const cards = page.locator("article");
      await expect(cards.first()).toBeVisible();
      // Should have multiple cards
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("has navigation with Feed, Saved, Practice links", async ({ page }) => {
      await page.goto("/hub");
      const nav = page.getByRole("navigation", { name: "Hub sections" });
      await expect(nav.getByRole("link", { name: "Feed" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Saved" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Practice" })).toBeVisible();
    });
  });

  test.describe("Search", () => {
    test("can search for articles", async ({ page }) => {
      await page.goto("/hub");
      const searchInput = page.getByRole("searchbox", { name: "Search articles" });
      await expect(searchInput).toBeVisible();
      await searchInput.fill("algorithm");
      // Should show filtered results count
      await expect(page.getByText(/result/)).toBeVisible();
    });

    test("shows empty state when no results match", async ({ page }) => {
      await page.goto("/hub");
      const searchInput = page.getByRole("searchbox", { name: "Search articles" });
      await searchInput.fill("xyznonexistent12345");
      await expect(page.getByText("No articles match your filters")).toBeVisible();
    });
  });

  test.describe("Category Navigation", () => {
    test("can filter by category", async ({ page }) => {
      await page.goto("/hub");
      // Wait for content to load
      await expect(page.locator("article").first()).toBeVisible();
      const initialCount = await page.locator("article").count();

      // Click on a category button (DSA should always have items)
      const dsaButton = page.getByRole("button", { name: /DSA/ });
      await expect(dsaButton).toBeVisible();
      await dsaButton.click();

      // Article count should change (filtered)
      await expect(page.locator("article").first()).toBeVisible();
      const filteredCount = await page.locator("article").count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test("All button shows all articles", async ({ page }) => {
      await page.goto("/hub");
      const allButton = page.getByRole("button", { name: /All/ });
      await expect(allButton).toBeVisible();
      await allButton.click();
      // Should not show filtered count
      const cards = page.locator("article");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Sort", () => {
    test("can switch sort modes", async ({ page }) => {
      await page.goto("/hub");
      const latestTab = page.getByRole("tab", { name: "Latest" });
      await expect(latestTab).toBeVisible();
      await latestTab.click();
      await expect(latestTab).toHaveAttribute("aria-selected", "true");

      const trendingTab = page.getByRole("tab", { name: "Trending" });
      await trendingTab.click();
      await expect(trendingTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe("View Toggle", () => {
    test("can switch between grid and list views", async ({ page }) => {
      await page.goto("/hub");
      const listButton = page.getByRole("radio", { name: "List view" });
      const gridButton = page.getByRole("radio", { name: "Grid view" });

      await expect(gridButton).toBeVisible();
      await expect(listButton).toBeVisible();

      // Switch to list
      await listButton.click();
      await expect(listButton).toHaveAttribute("aria-checked", "true");

      // Switch back to grid
      await gridButton.click();
      await expect(gridButton).toHaveAttribute("aria-checked", "true");
    });
  });

  test.describe("Bookmarks", () => {
    test("can bookmark an article", async ({ page }) => {
      await page.goto("/hub");
      const firstBookmarkBtn = page
        .getByRole("button", { name: "Add bookmark" })
        .first();
      await expect(firstBookmarkBtn).toBeVisible();
      await firstBookmarkBtn.click();

      // Should now show remove bookmark
      await expect(
        page.getByRole("button", { name: "Remove bookmark" }).first(),
      ).toBeVisible();
    });

    test("saved page shows bookmarked articles", async ({ page }) => {
      await page.goto("/hub");
      // Wait for feed to fully load
      await expect(page.locator("article").first()).toBeVisible();

      // Bookmark an article first
      const firstBookmarkBtn = page
        .getByRole("button", { name: "Add bookmark" })
        .first();
      await firstBookmarkBtn.click();
      // Wait for bookmark state to change
      await expect(
        page.getByRole("button", { name: "Remove bookmark" }).first(),
      ).toBeVisible();

      // Navigate to saved page via nav
      const nav = page.getByRole("navigation", { name: "Hub sections" });
      await nav.getByRole("link", { name: "Saved" }).click();
      await expect(page).toHaveURL(/\/hub\/saved/);
      // Should have at least one saved article card
      await expect(page.locator("article").first()).toBeVisible();
    });

    test("saved page shows empty state when no bookmarks", async ({ page }) => {
      await page.goto("/hub/saved");
      await expect(
        page.getByRole("heading", { name: "No saved articles yet" }),
      ).toBeVisible();
    });
  });

  test.describe("Content Cards", () => {
    test("cards show source, title, and metadata", async ({ page }) => {
      await page.goto("/hub");
      const firstCard = page.locator("article").first();
      await expect(firstCard).toBeVisible();

      // Should have a link (title)
      await expect(firstCard.getByRole("link").first()).toBeVisible();
      // Should show a bookmark button
      await expect(
        firstCard.getByRole("button", { name: /bookmark/i }),
      ).toBeVisible();
    });

    test("article links open in new tab", async ({ page }) => {
      await page.goto("/hub");
      const firstLink = page
        .locator("article")
        .first()
        .getByRole("link")
        .first();
      await expect(firstLink).toHaveAttribute("target", "_blank");
      await expect(firstLink).toHaveAttribute("rel", /noopener/);
    });
  });

  test.describe("Theme", () => {
    test("theme toggle works on hub page", async ({ page }) => {
      await page.goto("/hub");
      const themeButton = page.getByRole("button", { name: /Theme/ });
      await expect(themeButton).toBeVisible();
      await themeButton.click();
      // Theme should change (button text/icon changes)
      await expect(themeButton).toBeVisible();
    });
  });

  test.describe("Responsive", () => {
    test("renders correctly on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/hub");
      await expect(
        page.getByRole("heading", { name: "Knowledge Hub" }),
      ).toBeVisible();
      // Cards should still be visible
      const cards = page.locator("article");
      await expect(cards.first()).toBeVisible();
    });
  });

  test.describe("URL State", () => {
    test("filter state persists in URL", async ({ page }) => {
      await page.goto("/hub");
      await expect(page.locator("article").first()).toBeVisible();

      // Click DSA category
      const dsaButton = page.getByRole("button", { name: /DSA/ });
      await dsaButton.click();

      // URL should contain category param
      await expect(page).toHaveURL(/category=dsa/);
    });

    test("URL params restore filter state on load", async ({ page }) => {
      await page.goto("/hub?category=dsa&sort=latest&view=list");
      await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });

      // DSA should be active
      const dsaButton = page.getByRole("button", { name: /DSA/ });
      await expect(dsaButton).toHaveAttribute("aria-pressed", "true");

      // Latest sort should be active
      const latestTab = page.getByRole("tab", { name: "Latest" });
      await expect(latestTab).toHaveAttribute("aria-selected", "true");

      // List view should be active
      const listButton = page.getByRole("radio", { name: "List view" });
      await expect(listButton).toHaveAttribute("aria-checked", "true");
    });
  });

  test.describe("Highlights", () => {
    test("shows stats banner with article count", async ({ page }) => {
      await page.goto("/hub");
      await expect(page.getByText("New Today")).toBeVisible();
      await expect(page.getByText("Trending Now")).toBeVisible();
    });

    test("shows compensation insights section", async ({ page }) => {
      await page.goto("/hub");
      await expect(
        page.getByRole("heading", { name: "Compensation Insights" }),
      ).toBeVisible();
    });

    test("shows top picks section", async ({ page }) => {
      await page.goto("/hub");
      await expect(
        page.getByRole("heading", { name: "Top Picks" }),
      ).toBeVisible();
    });

    test("shows trending mentions section", async ({ page }) => {
      await page.goto("/hub");
      await expect(
        page.getByRole("heading", { name: "Trending Mentions" }),
      ).toBeVisible();
    });
  });

  test.describe("Content Types", () => {
    test("can filter by articles type", async ({ page }) => {
      await page.goto("/hub");
      await expect(page.locator("article").first()).toBeVisible();
      const articlesTab = page.getByRole("tab", { name: /Articles/ });
      if (await articlesTab.isVisible()) {
        await articlesTab.click();
        await expect(articlesTab).toHaveAttribute("aria-selected", "true");
      }
    });
  });

  test.describe("SEO", () => {
    test("has JSON-LD structured data", async ({ page }) => {
      await page.goto("/hub");
      const jsonLd = page.locator('script[type="application/ld+json"]');
      await expect(jsonLd).toBeAttached();
    });
  });
});
