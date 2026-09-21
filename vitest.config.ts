import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      include: ["src/domain/**/*.ts", "src/core/**/*.ts", "src/permissions/**/*.ts"]
    }
  }
});
