import { defineConfig } from "@rstest/core";
import { withRslibConfig } from "@rstest/adapter-rslib";

export default defineConfig({
  extends: withRslibConfig(),
  coverage: {
    exclude: [
      ".rslib/**",
      "./dist/**",
      "./test/**",
      "./rslib.config.ts",
      "./rstest.config.ts",
    ],
    thresholds: {
      statements: 100,
      functions: 100,
      branches: 98,
      lines: 100,
    },
  },
});
