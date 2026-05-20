import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "shared/**/*.test.ts",
      "tests/**/*.test.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.test.tsx",
    ],
    environmentMatchGlobs: [
      ["client/src/**/*.test.{ts,tsx}", "jsdom"],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "server/fixtures-complete.ts",
        "**/*.config.{js,ts}",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
