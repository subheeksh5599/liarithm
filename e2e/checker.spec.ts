import { expect, test } from "@playwright/test";

test.describe("case checker", () => {
  test("every version of the live case is solvable", async ({ page }) => {
    await page.goto("/studios/check");
    await expect(page.locator(".check-live .tag")).toHaveCount(4);
    await expect(page.locator(".check-live .tag.live")).toHaveCount(4);
  });

  test("the sample case passes", async ({ page }) => {
    await page.goto("/studios/check");
    await page.getByRole("button", { name: "Check this case" }).click();
    await expect(page.locator(".check-out .big-check")).toHaveText("✓ Solvable");
    await expect(page.locator(".lie-row").first()).toBeVisible();
  });

  test("Break it produces a case that cannot be won, with the reason", async ({ page }) => {
    await page.goto("/studios/check");
    await page.getByRole("button", { name: "Break it" }).click();
    await page.getByRole("button", { name: "Check this case" }).click();
    await expect(page.locator(".check-out .big-check")).toHaveText("✗ Not solvable as written");
    await expect(page.locator(".check-out")).toContainText("FACT_MISMATCH");
  });

  test("invalid JSON is refused with a message", async ({ page }) => {
    await page.goto("/studios/check");
    await page.locator(".check-input").fill("{ not json");
    await page.getByRole("button", { name: "Check this case" }).click();
    await expect(page.locator(".check-out")).toContainText("not valid JSON");
  });

  test("the live check does not reveal any thief", async ({ request }) => {
    const r = await request.get("/api/check");
    const text = await r.text();
    for (const name of ["kai", "sora", "jin", "ren", "culprit"]) expect(text.toLowerCase()).not.toContain(name);
  });
});
