import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      exclude: [
        "**/dist/**",
        "**/test/**",
        "**/tailwind.config.js",
      ],
    },
  },
});
