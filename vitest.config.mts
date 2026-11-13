import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.dirname(new URL(import.meta.url).pathname) } },
  test: { include: ["tests/**/*.test.ts"] },
});
