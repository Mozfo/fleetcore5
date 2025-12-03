import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed CRM Settings
 *
 * Seeds the crm_settings table with:
 * - lead_stages (Phase 1.6)
 * - opportunity_stages (Phase 1.6)
 * - opportunity_loss_reasons (Phase 1.6)
 *
 * Run: pnpm exec tsx scripts/seed-crm-settings.ts
 */
async function seedCrmSettings(): Promise<number> {
  const settings = [
    // ========================================================================
    // Pipeline Settings
    // ========================================================================
    {
      setting_key: "lead_stages",
      category: "stages",
      data_type: "object",
      is_system: true,
      description: "Lead pipeline stages configuration",
      setting_value: {
        stages: [
          {
            value: "top_of_funnel",
            label_en: "Top of Funnel",
            label_fr: "Haut du funnel",
            color: "blue",
            order: 1,
            is_active: true,
            auto_actions: ["assign_to_queue"],
          },
          {
            value: "marketing_qualified",
            label_en: "Marketing Qualified (MQL)",
            label_fr: "Qualifié Marketing (MQL)",
            color: "purple",
            order: 2,
            is_active: true,
            auto_actions: ["calculate_score"],
          },
          {
            value: "sales_qualified",
            label_en: "Sales Qualified (SQL)",
            label_fr: "Qualifié Ventes (SQL)",
            color: "green",
            order: 3,
            is_active: true,
            auto_actions: ["send_notification"],
          },
          {
            value: "opportunity",
            label_en: "Opportunity",
            label_fr: "Opportunité",
            color: "yellow",
            order: 4,
            is_active: true,
            auto_actions: ["create_opportunity"],
          },
        ],
        transitions: {
          top_of_funnel: ["marketing_qualified"],
          marketing_qualified: ["sales_qualified", "top_of_funnel"],
          sales_qualified: ["opportunity", "marketing_qualified"],
          opportunity: [],
        },
        default_stage: "top_of_funnel",
      },
    },
    {
      setting_key: "opportunity_stages",
      category: "stages",
      data_type: "object",
      is_system: true,
      description:
        "Opportunity pipeline stages with deal rotting configuration",
      setting_value: {
        stages: [
          {
            value: "qualification",
            label_en: "Qualification",
            label_fr: "Qualification",
            probability: 20,
            max_days: 14,
            color: "blue",
            order: 1,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "demo",
            label_en: "Demo",
            label_fr: "Démonstration",
            probability: 40,
            max_days: 10,
            color: "purple",
            order: 2,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "proposal",
            label_en: "Proposal",
            label_fr: "Proposition",
            probability: 60,
            max_days: 14,
            color: "yellow",
            order: 3,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "negotiation",
            label_en: "Negotiation",
            label_fr: "Négociation",
            probability: 80,
            max_days: 10,
            color: "orange",
            order: 4,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "contract_sent",
            label_en: "Contract Sent",
            label_fr: "Contrat envoyé",
            probability: 90,
            max_days: 7,
            color: "green",
            order: 5,
            deal_rotting: true,
            is_active: true,
          },
        ],
        final_stages: {
          won: { label_en: "Won", label_fr: "Gagné", probability: 100 },
          lost: { label_en: "Lost", label_fr: "Perdu", probability: 0 },
        },
        rotting: {
          enabled: true,
          use_stage_max_days: true,
          global_threshold_days: null,
          alert_owner: true,
          alert_manager: true,
          cron_time: "08:00",
        },
      },
    },
    {
      setting_key: "opportunity_loss_reasons",
      category: "workflows",
      data_type: "object",
      is_system: true,
      description: "Loss reasons for opportunities with recovery workflow",
      setting_value: {
        default: null,
        reasons: [
          // Price category
          {
            value: "price_too_high",
            label_en: "Price too high",
            label_fr: "Prix trop élevé",
            category: "price",
            order: 1,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 90,
            require_competitor_name: false,
          },
          {
            value: "no_budget",
            label_en: "No budget",
            label_fr: "Pas de budget",
            category: "price",
            order: 2,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: false,
          },
          {
            value: "roi_not_demonstrated",
            label_en: "ROI not demonstrated",
            label_fr: "ROI non démontré",
            category: "price",
            order: 3,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 60,
            require_competitor_name: false,
          },
          // Product category
          {
            value: "feature_missing",
            label_en: "Feature missing",
            label_fr: "Fonctionnalité manquante",
            category: "product",
            order: 4,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 120,
            require_competitor_name: false,
          },
          {
            value: "integration_missing",
            label_en: "Integration not available",
            label_fr: "Intégration non disponible",
            category: "product",
            order: 5,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 90,
            require_competitor_name: false,
          },
          {
            value: "ui_too_complex",
            label_en: "UI too complex",
            label_fr: "Interface trop complexe",
            category: "product",
            order: 6,
            is_active: true,
            is_recoverable: false,
            recovery_delay_days: null,
            require_competitor_name: false,
          },
          // Competition category
          {
            value: "competitor_won_price",
            label_en: "Competitor won (price)",
            label_fr: "Concurrent gagné (prix)",
            category: "competition",
            order: 7,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: true,
          },
          {
            value: "competitor_won_features",
            label_en: "Competitor won (features)",
            label_fr: "Concurrent gagné (fonctionnalités)",
            category: "competition",
            order: 8,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: true,
          },
          // Timing category
          {
            value: "project_cancelled",
            label_en: "Project cancelled",
            label_fr: "Projet annulé",
            category: "timing",
            order: 9,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 90,
            require_competitor_name: false,
          },
          {
            value: "not_ready_now",
            label_en: "Not ready now",
            label_fr: "Pas prêt maintenant",
            category: "timing",
            order: 10,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 60,
            require_competitor_name: false,
          },
          {
            value: "bad_timing",
            label_en: "Bad timing",
            label_fr: "Mauvais timing",
            category: "timing",
            order: 11,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: false,
          },
          // Other category
          {
            value: "no_response",
            label_en: "No response",
            label_fr: "Pas de réponse",
            category: "other",
            order: 12,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 60,
            require_competitor_name: false,
          },
          {
            value: "bad_fit",
            label_en: "Bad product fit",
            label_fr: "Mauvais fit produit",
            category: "other",
            order: 13,
            is_active: true,
            is_recoverable: false,
            recovery_delay_days: null,
            require_competitor_name: false,
          },
          {
            value: "other",
            label_en: "Other",
            label_fr: "Autre",
            category: "other",
            order: 99,
            is_active: true,
            is_recoverable: false,
            recovery_delay_days: null,
            require_competitor_name: false,
          },
        ],
        recovery_workflow: {
          auto_create_followup: true,
          send_reminder_email: true,
          reminder_days_before: 7,
          auto_reopen: false,
        },
      },
    },
  ];

  for (const setting of settings) {
    await prisma.crm_settings.upsert({
      where: { setting_key: setting.setting_key },
      create: setting,
      update: {
        setting_value: setting.setting_value,
        description: setting.description,
      },
    });
  }

  return settings.length;
}

async function main() {
  try {
    const count = await seedCrmSettings();
    process.stdout.write(`Seeded ${count} CRM settings\n`);
    process.exit(0);
  } catch (error) {
    process.stderr.write(`Seed failed: ${error}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
