import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/money/index.ts"],
      // packages/core is pure domain logic and must stay fully covered (CLAUDE.md).
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
