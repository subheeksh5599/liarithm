import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3517);
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: BASE, ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  // Against a deployed URL, nothing is started. Locally, the production build is served.
  webServer: process.env.E2E_BASE_URL ? undefined : { command: `npx next start -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 60_000 },
});
