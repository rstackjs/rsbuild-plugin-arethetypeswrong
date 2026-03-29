import { withRslibConfig } from "@rstest/adapter-rslib";
import { defineConfig } from "@rstest/core";

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
