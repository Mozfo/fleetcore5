/**
 * GET /api/public/segments
 * Returns homepage segments configuration from crm_settings
 *
 * Public endpoint - no authentication required
 * Data is fetched from crm_settings with key "homepage_segments_config"
 *
 * Response includes cache headers for 1 hour (config is stable)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const SETTING_KEY = "homepage_segments_config";
const CACHE_MAX_AGE = 3600; // 1 hour

export async function GET() {
  try {
    logger.info("[API] GET /api/public/segments - Fetching segments config");

    const setting = await db.crm_settings.findUnique({
      where: {
        setting_key: SETTING_KEY,
        is_active: true,
        deleted_at: null,
      },
      select: {
        setting_value: true,
        version: true,
        updated_at: true,
      },
    });

    if (!setting) {
      logger.warn(
        "[API] GET /api/public/segments - Config not found, returning defaults"
      );

      // Return default config if not found in DB
      return NextResponse.json(
        {
          success: true,
          data: getDefaultSegments(),
          source: "default",
        },
        {
          headers: {
            "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
          },
        }
      );
    }

    logger.info(
      `[API] GET /api/public/segments - Found config v${setting.version}`
    );

    return NextResponse.json(
      {
        success: true,
        data: setting.setting_value,
        version: setting.version,
        source: "database",
      },
      {
        headers: {
          "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
        },
      }
    );
  } catch (error) {
    logger.error({ error }, "[API] GET /api/public/segments - Error");

    // On error, return default segments to keep homepage functional
    return NextResponse.json(
      {
        success: true,
        data: getDefaultSegments(),
        source: "fallback",
      },
      { status: 200 }
    );
  }
}

/**
 * Default segments configuration
 * Used as fallback when database config is not available
 */
function getDefaultSegments() {
  return {
    segments: [
      {
        id: "solo",
        icon: "car",
        color: "blue",
        fleet_size: { min: 1, max: 1 },
        name: { en: "Solo Driver", fr: "Chauffeur Indépendant" },
        subtitle: { en: "1 vehicle", fr: "1 véhicule" },
        tagline: {
          en: "Maximize your earnings, simplify your taxes",
          fr: "Maximisez vos revenus, simplifiez vos impôts",
        },
        features: [
          {
            en: "Real-time earnings tracking",
            fr: "Suivi des revenus en temps réel",
          },
          {
            en: "Automatic mileage tracking",
            fr: "Suivi kilométrique automatique",
          },
          {
            en: "Multi-platform sync (Uber, Bolt, Careem)",
            fr: "Sync multi-plateformes (Uber, Bolt, Careem)",
          },
          { en: "Expense tracking", fr: "Suivi des dépenses" },
          { en: "Tax-ready reports", fr: "Rapports fiscaux" },
          { en: "Performance insights", fr: "Insights performance" },
        ],
        cta: {
          text: { en: "Download App", fr: "Télécharger l'App" },
          link: "/solopreneur",
          show_app_badges: true,
        },
      },
      {
        id: "fleet",
        icon: "building2",
        color: "purple",
        fleet_size: { min: 2, max: null },
        name: { en: "Fleet Operator", fr: "Opérateur de Flotte" },
        subtitle: { en: "2 to 5000+ vehicles", fr: "De 2 à 5000+ véhicules" },
        tagline: {
          en: "One platform to manage your entire fleet",
          fr: "Une plateforme pour gérer toute votre flotte",
        },
        features: [
          {
            en: "Multi-platform revenue import",
            fr: "Import revenus multi-plateformes",
          },
          {
            en: "Vehicle full lifecycle management",
            fr: "Gestion cycle de vie véhicule",
          },
          {
            en: "Driver recruitment module",
            fr: "Module recrutement chauffeurs",
          },
          {
            en: "Financial cashbox system",
            fr: "Système de caisse financier",
          },
          { en: "Maintenance scheduling", fr: "Planification maintenance" },
          { en: "Real-time analytics", fr: "Analytics temps réel" },
        ],
        cta: {
          text: { en: "Book a Demo", fr: "Réserver une Démo" },
          link: "/book-demo",
          show_app_badges: false,
        },
      },
    ],
  };
}
