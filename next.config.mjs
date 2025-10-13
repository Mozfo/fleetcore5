import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Réactiver Turbopack car versions compatibles
  experimental: {
    // Pour Next.js < 15, sinon pas nécessaire
  },

  // Supprimer les warnings d'hydratation des extensions
  reactStrictMode: true,

  // Configuration pour Sentry + Turbopack
  transpilePackages: ["@sentry/nextjs"],
};

// Configuration Sentry documentée
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Empêcher l'upload des source maps en dev
  silent: true,
  dryRun: process.env.NODE_ENV === "development",

  // Compatible avec Turbopack
  hideSourceMaps: false,
  disableLogger: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
