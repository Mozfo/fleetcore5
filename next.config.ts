import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Build Optimization for Vercel 8GB Memory Limit
   *
   * Problem: TypeScript type-checking and ESLint with type-aware rules load
   * the full project into memory. For 700+ files, this exceeds Vercel's 8GB limit.
   *
   * Solution: CI/CD Separation (industry best practice)
   * - GitHub Actions CI: Full validation before merge
   *   See: .github/workflows/api-tests.yml (lines 74-78)
   *   - pnpm typecheck (TypeScript strict)
   *   - pnpm lint (ESLint with type-aware rules)
   * - Vercel: Build only (validation already passed in CI)
   *
   * Sources:
   * - https://vercel.com/docs/errors/sigkill-out-of-memory
   * - https://nextjs.org/docs/app/guides/memory-usage
   * - https://www.zhyd1997.dev/blog/resolve-nextjs-build-oom-on-vercel
   *
   * Also set in Vercel Dashboard > Settings > Environment Variables:
   * NODE_OPTIONS = --max-old-space-size=6144
   */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Disable source maps in production (significant memory savings)
  productionBrowserSourceMaps: false,

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
    webpackMemoryOptimizations: true, // Reduce webpack memory usage
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
