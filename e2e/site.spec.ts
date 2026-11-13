import { expect, test } from "@playwright/test";

test.describe("start screen", () => {
  test("shows the title and the four ways in", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".menu-title")).toHaveText("Liarithm");
    for (const name of ["Play", "Case files", "How it works", "For studios"]) await expect(page.locator(".stage-nav").getByRole("link", { name })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "For judges" })).toBeVisible();
  });

  test("the background video is served", async ({ page, request }) => {
    await page.goto("/");
    await expect(page.locator("video.menu-video source")).toHaveCount(2);
    const r = await request.get("/art/menu-bg.mp4");
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("video/mp4");
  });

  const links: [string, string][] = [
    ["Play", "/case/black-diamond"],
    ["Case files", "/cases"],
    ["How it works", "/how"],
    ["For studios", "/studios"],
    ["For judges", "/judges"],
  ];
  for (const [name, path] of links) {
    test(`${name} goes to ${path}`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name }).first().click();
      await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: 20_000 }); // a cold serverless start can take seconds
    });
  }
});

test.describe("pages", () => {
  const pages: [string, string][] = [
    ["/cases", "The Black Diamond"],
    ["/how", "How it works"],
    ["/studios", "Characters that keep secrets"],
    ["/studios/check", "Case checker"],
    ["/judges", "For judges"],
  ];
  for (const [path, heading] of pages) {
    test(`${path} renders`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByText(heading).first()).toBeVisible();
    });
  }

  test("an unknown case is a 404", async ({ page }) => {
    const res = await page.goto("/case/not-a-case");
    expect(res?.status()).toBe(404);
  });

  test("the judges page explains a full game in five steps", async ({ page }) => {
    await page.goto("/judges");
    await expect(page.locator(".judge-steps li")).toHaveCount(5);
    await expect(page.getByRole("cell", { name: "SERV Reasoning" }).first()).toBeVisible();
  });
});

test.describe("desktop only", () => {
  test.use({ viewport: { width: 820, height: 1000 } });
  test("a narrow window gets the desktop note instead of the game", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".desktop-only")).toBeVisible();
    await expect(page.locator(".menu")).toBeHidden();
  });
});
