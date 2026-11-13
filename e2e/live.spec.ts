import { expect, test } from "@playwright/test";
import { accuse, openCase, thiefOf } from "./helpers";

// Plays a whole case against the real models: question the thief, catch the lie with evidence, accuse.
// Runs only with E2E_LIVE=1, because it spends model credit.
test.skip(!process.env.E2E_LIVE, "set E2E_LIVE=1 to play against the live models");
test.setTimeout(300_000);

const PLAN = {
  kai: { name: "Kai", ask: "Where were you between eight and half past eight tonight?", show: "Phone Location" },
  sora: { name: "Sora", ask: "Where were you between eight and half past eight tonight?", show: "Office Keycard Log" },
  jin: { name: "Jin", ask: "Did you stay with the car the whole evening?", show: "CCTV Footage" },
  ren: { name: "Ren", ask: "Where were you between eight and half past eight tonight?", show: "Office Keycard Log" },
} as const;

test("question the thief, catch the lie, win", async ({ page }) => {
  await openCase(page);
  const thief = await thiefOf(page);
  const p = PLAN[thief];
  await page.locator(".suspect", { hasText: p.name }).click();

  await page.locator(".ask input").fill(p.ask);
  await page.locator(".ask button[type=submit]").click();
  await expect(page.locator(".chat .bubble")).toHaveCount(2, { timeout: 200_000 });

  await page.locator(".ev", { hasText: p.show }).click();
  await page.locator(".ask input").fill("Then explain this.");
  await page.locator(".ask button[type=submit]").click();
  await expect(page.locator(".lie-flash")).toBeVisible({ timeout: 200_000 });
  await page.getByRole("button", { name: "Keep going" }).click();

  await accuse(page, p.name);
  await expect(page.locator(".overlay .modal h2")).toHaveText(/right/i);
});
