import { expect, test } from "@playwright/test";
import { accuse, openCase, thiefOf } from "./helpers";

const NAME = { kai: "Kai", sora: "Sora", jin: "Jin", ren: "Ren" } as const;

test.describe("the interrogation room", () => {
  test("opens with four suspects and five pieces of evidence", async ({ page }) => {
    await openCase(page);
    await expect(page.locator(".suspect")).toHaveCount(4);
    await expect(page.locator(".ev-list .ev")).toHaveCount(5);
    await expect(page.getByText("Questions left · 24")).toBeVisible();
  });

  test("there are no suggested questions", async ({ page }) => {
    await openCase(page);
    await expect(page.locator(".chip")).toHaveCount(0);
  });

  for (const who of ["Kai", "Ren", "Sora", "Jin"]) {
    test(`selecting ${who} puts them at the table`, async ({ page }) => {
      await openCase(page);
      await page.locator(".suspect", { hasText: who }).click();
      await expect(page.locator(".scene img.room")).toHaveAttribute("alt", `${who} at the interrogation table`);
      await expect(page.locator(".ask input")).toHaveAttribute("placeholder", `Question ${who}…`);
    });
  }

  test("clicking evidence attaches it to the next question, clicking again removes it", async ({ page }) => {
    await openCase(page);
    const first = page.locator(".ev-list .ev").first();
    await first.click();
    await expect(page.locator(".attached")).toBeVisible();
    await first.click();
    await expect(page.locator(".attached")).toHaveCount(0);
  });

  test("no answer, secret or hash is shown before the accusation", async ({ page }) => {
    await openCase(page);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/[0-9a-f]{64}/);
    expect(body).not.toContain("What really happened");
  });
});

test.describe("the thief changes", () => {
  test("ten fresh games reach at least two different thieves", async ({ page }) => {
    const seen = new Set<string>();
    for (let i = 0; i < 10 && seen.size < 2; i++) {
      await openCase(page);
      seen.add(await thiefOf(page));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  test("Play again starts a new sealed session", async ({ page }) => {
    await openCase(page);
    const before = await page.evaluate(() => localStorage.getItem("liarithm:black-diamond"));
    await accuse(page, "Kai");
    await page.getByRole("button", { name: "Play again" }).click();
    await expect(page.locator(".overlay")).toHaveCount(0);
    const after = await page.evaluate(() => localStorage.getItem("liarithm:black-diamond"));
    expect(after).not.toBe(before);
  });
});

test.describe("the ending", () => {
  test("naming the thief says Right and tells the story", async ({ page }) => {
    await openCase(page);
    const thief = await thiefOf(page);
    await accuse(page, NAME[thief]);
    await expect(page.locator(".overlay .modal h2")).toHaveText(/right/i);
    await expect(page.locator(".overlay .modal")).toContainText(`It was ${NAME[thief]}.`);
  });

  test("naming someone else says Wrong and names the thief", async ({ page }) => {
    await openCase(page);
    const thief = await thiefOf(page);
    const other = (["kai", "sora", "jin", "ren"] as const).find((x) => x !== thief)!;
    await accuse(page, NAME[other]);
    await expect(page.locator(".overlay .modal h2")).toHaveText(/wrong/i);
    await expect(page.locator(".overlay .modal")).toContainText(`It was ${NAME[thief]}.`);
  });

  test("the ending shows no hashes", async ({ page }) => {
    await openCase(page);
    await accuse(page, "Ren");
    const text = await page.locator(".overlay .modal").innerText();
    expect(text).not.toMatch(/[0-9a-f]{64}/);
    expect(text).not.toContain("fingerprint");
  });

  test("questions are locked after the accusation", async ({ page }) => {
    await openCase(page);
    await accuse(page, "Jin");
    await expect(page.locator(".ask input")).toBeDisabled();
  });
});
