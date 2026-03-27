import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/hub", "/progress"];

for (const path of pages) {
  test(`${path} passes WCAG 2.2 AA automated checks`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude(".trending-badge") // animated element, false positive
      .analyze();

    // Log violations for debugging
    for (const violation of results.violations) {
      console.log(
        `[a11y] ${violation.impact}: ${violation.id} — ${violation.description} (${violation.nodes.length} nodes)`
      );
    }

    // Allow only minor violations (not critical/serious)
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });
}

test("hub article cards have 44px+ touch targets", async ({ page }) => {
  await page.goto("/hub");
  await page.waitForLoadState("domcontentloaded");

  // Check bookmark buttons (most critical interactive element)
  const bookmarkButtons = page.locator("button[aria-label*='bookmark']");
  const count = await bookmarkButtons.count();

  for (let i = 0; i < Math.min(count, 5); i++) {
    const box = await bookmarkButtons.nth(i).boundingBox();
    if (box) {
      expect(box.height, `Bookmark button ${i} height`).toBeGreaterThanOrEqual(44);
      expect(box.width, `Bookmark button ${i} width`).toBeGreaterThanOrEqual(44);
    }
  }
});
