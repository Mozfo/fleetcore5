/**
 * Seed script for homepage segments configuration
 *
 * Run with: pnpm exec tsx scripts/seed-segments-config.ts
 *
 * This creates/updates the homepage_segments_config in crm_settings
 * which drives the Segmentation component on the homepage.
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

const SETTING_KEY = "homepage_segments_config";

const segmentsConfig = {
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
        link: "/request-demo",
        show_app_badges: false,
      },
    },
  ],
};

async function main() {
  logger.info("[Seed] Starting homepage segments configuration...");

  const result = await prisma.crm_settings.upsert({
    where: {
      setting_key: SETTING_KEY,
    },
    update: {
      setting_value: segmentsConfig,
      updated_at: new Date(),
      version: {
        increment: 1,
      },
    },
    create: {
      setting_key: SETTING_KEY,
      setting_value: segmentsConfig,
      category: "ui",
      data_type: "object",
      description: "Homepage segmentation cards configuration (Solo vs Fleet)",
      display_label: "Homepage Segments",
      is_active: true,
      is_system: true,
      version: 1,
      schema_version: "1.0",
    },
  });

  logger.info(
    {
      version: result.version,
      settingKey: result.setting_key,
      category: result.category,
      segmentsCount: (result.setting_value as { segments: unknown[] }).segments
        .length,
    },
    "[Seed] Segments config saved successfully"
  );
}

main()
  .catch((e) => {
    logger.error({ error: e }, "[Seed] Failed to seed segments config");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
