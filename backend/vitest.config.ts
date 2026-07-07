import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Run tests sequentially to avoid DB conflicts during integration tests
    pool: "forks",
    singleFork: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/server.ts"],
    },
  },
});
