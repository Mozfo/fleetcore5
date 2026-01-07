import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * ESLint Configuration for Vercel Builds
   *
   * ESLint with type-aware rules (parserOptions.project in eslint.config.mjs)
   * requires loading the full TypeScript project into memory. For 700+ files,
   * this exceeds Vercel's 8GB memory limit, causing OOM errors.
   *
   * Architecture (industry best practice):
   * - GitHub Actions CI: Full validation (ESLint + TypeScript + Tests)
   *   See: .github/workflows/api-tests.yml lines 74-81
   * - Vercel: Build only (validation already done in CI before merge)
   *
   * Sources:
   * - Next.js docs: "not recommended unless you already have ESLint
   *   configured to run in a separate part of your workflow (for example, in CI)"
   * - typescript-eslint docs: "most users primarily run complete lint via their CI"
   * - Vercel docs: 8GB memory limit per build container
   *
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/eslint
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Externaliser les packages Pino pour éviter le bundling qui casse les worker threads
  // Fix: "Error: the worker thread exited" lors du logging avec Pino
  // Ref: https://github.com/pinojs/pino/issues/1429
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "pino-worker",
    "pino-file",
    "thread-stream",
    "@sentry/profiling-node",
  ],

  experimental: {
    turbo: {}, // Support pour Turbopack dans Next.js 15
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "bluewise-group",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
