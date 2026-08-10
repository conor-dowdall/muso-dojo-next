import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/audio/samplePacks.generated.ts",
      ],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        branches: 56,
        functions: 56,
        lines: 60.5,
        statements: 60,
      },
    },
    environment: "node",
    globals: false,
  },
});
