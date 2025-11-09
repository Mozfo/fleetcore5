import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest configuration for INTEGRATION TESTS
 *
 * Supports both SQLite (Phase 0.1) and PostgreSQL Testcontainers (Phase 0.3)
 *
 * Key differences from vitest.config.ts (unit tests):
 * - SQLite: in-memory database for Phase 0.1 tests
 * - PostgreSQL: Docker containers for Phase 0.3 tests (production parity)
 * - Long timeouts for container startup (60s)
 * - Forks pool for test isolation with containers
 *
 * Usage:
 *   pnpm exec vitest run --config vitest.config.integration.ts
 */
export default defineConfig({
  test: {
    // Environment: Node.js (backend testing)
    environment: "node",

    // Globals: true (avoid repeated imports)
    globals: true,

    // Include ONLY integration tests
    include: ["lib/**/*.integration.test.ts", "**/*.integration.test.ts"],
    exclude: ["node_modules", ".next", "dist"],

    // Timeout: Longer for Docker container operations
    testTimeout: 60000, // 60s for container startup + migrations
    hookTimeout: 60000, // 60s for beforeAll/afterAll hooks

    // Disable threads/parallelization for database tests (Prisma recommendation)
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true, // Run all tests sequentially in one thread
      },
    },

    // Setup files: Different setups for different test types
    // Note: Each test file imports its own setup (SQLite or PostgreSQL)
    // No global setupFiles to allow per-file container isolation

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "vitest.config.ts",
        "vitest.config.integration.ts",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.integration.test.ts",
      ],
    },
  },

  resolve: {
    // Alias for @ imports
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
