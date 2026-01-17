/**
 * Playwright E2E Test Configuration
 *
 * V6.2-12: E2E tests for FleetCore V6.3 flows
 *
 * Environment variables:
 * - PLAYWRIGHT_BASE_URL: Base URL for tests (required)
 * - CI: Set in CI environment for stricter settings
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL for tests - must be provided via environment variable
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!baseURL) {
  throw new Error("PLAYWRIGHT_BASE_URL environment variable is required");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
