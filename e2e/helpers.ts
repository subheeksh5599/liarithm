import type { Page } from "@playwright/test";

/** Which version of case 01 this session drew, read the way a player could: from the evidence cards. */
export async function thiefOf(page: Page): Promise<"kai" | "sora" | "jin" | "ren"> {
  const text = await page.locator(".ev-list").innerText();
  if (text.includes("R. Takeda (spare)")) return "jin";
  if (text.includes("Sora's phone")) return "sora";
  if (text.includes("Ren's phone")) return "ren";
  if (text.includes("Kai's phone")) return "kai";
  throw new Error(`unknown version: ${text}`);
}

export async function openCase(page: Page) {
  await page.goto("/case/black-diamond");
  await page.locator(".ev-list .ev").first().waitFor();
}

export async function accuse(page: Page, name: string) {
  await page.getByRole("button", { name: "Accuse", exact: true }).first().click();
  await page.locator(".pick button", { hasText: name }).click();
  await page.locator(".modal").getByRole("button", { name: "Accuse", exact: true }).click();
  await page.locator(".overlay .modal h2").waitFor();
}
