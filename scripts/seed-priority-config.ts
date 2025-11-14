import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Seed lead priority configuration in crm_settings
 *
 * This script creates/updates the lead_priority_config setting that defines
 * how qualification scores map to priority levels (low, medium, high, urgent).
 *
 * Run once: pnpm tsx scripts/seed-priority-config.ts
 */
async function seedPriorityConfig() {
  logger.info("🎯 Seeding lead_priority_config in crm_settings...");

  try {
    // Upsert lead_priority_config
    const setting = await prisma.crm_settings.upsert({
      where: { setting_key: "lead_priority_config" },
      update: {
        setting_value: {
          priority_levels: ["low", "medium", "high", "urgent"],
          thresholds: {
            urgent: { min: 80, color: "#dc2626", label: "Urgent", order: 4 },
            high: { min: 70, color: "#ea580c", label: "High", order: 3 },
            medium: { min: 40, color: "#f59e0b", label: "Medium", order: 2 },
            low: { min: 0, color: "#22c55e", label: "Low", order: 1 },
          },
          default: "medium",
        },
        description: "Lead priority levels and qualification score thresholds",
        category: "scoring",
        data_type: "object",
        is_active: true,
        is_system: true,
        version: 1,
        display_label: "Lead Priority Configuration",
        display_order: 3,
        ui_component: "nested_form",
        help_text: `Configure lead priority levels based on qualification scores.

**Priority Levels:**
- Urgent (80-100): Immediate attention required
- High (70-79): Sales Qualified Leads (SQL)
- Medium (40-69): Marketing Qualified Leads (MQL)
- Low (0-39): Top of Funnel (TOF)

**Customization:**
- Adjust thresholds to match your sales process
- Change colors for UI display
- Add new priority levels (e.g., "critical")
- Modify labels for localization

**Impact:**
- Takes effect immediately for new leads
- Existing leads keep their priority unless recalculated
- Used for filtering and sorting in dashboards`,
        documentation_url: "https://docs.fleetcore.com/crm/lead-priority",
        default_value: {
          priority_levels: ["low", "medium", "high", "urgent"],
          thresholds: {
            urgent: { min: 80, color: "#dc2626", label: "Urgent", order: 4 },
            high: { min: 70, color: "#ea580c", label: "High", order: 3 },
            medium: { min: 40, color: "#f59e0b", label: "Medium", order: 2 },
            low: { min: 0, color: "#22c55e", label: "Low", order: 1 },
          },
          default: "medium",
        },
        updated_at: new Date(),
      },
      create: {
        setting_key: "lead_priority_config",
        setting_value: {
          priority_levels: ["low", "medium", "high", "urgent"],
          thresholds: {
            urgent: { min: 80, color: "#dc2626", label: "Urgent", order: 4 },
            high: { min: 70, color: "#ea580c", label: "High", order: 3 },
            medium: { min: 40, color: "#f59e0b", label: "Medium", order: 2 },
            low: { min: 0, color: "#22c55e", label: "Low", order: 1 },
          },
          default: "medium",
        },
        description: "Lead priority levels and qualification score thresholds",
        category: "scoring",
        data_type: "object",
        is_active: true,
        is_system: true,
        version: 1,
        display_label: "Lead Priority Configuration",
        display_order: 3,
        ui_component: "nested_form",
        help_text: `Configure lead priority levels based on qualification scores.

**Priority Levels:**
- Urgent (80-100): Immediate attention required
- High (70-79): Sales Qualified Leads (SQL)
- Medium (40-69): Marketing Qualified Leads (MQL)
- Low (0-39): Top of Funnel (TOF)

**Customization:**
- Adjust thresholds to match your sales process
- Change colors for UI display
- Add new priority levels (e.g., "critical")
- Modify labels for localization

**Impact:**
- Takes effect immediately for new leads
- Existing leads keep their priority unless recalculated
- Used for filtering and sorting in dashboards`,
        documentation_url: "https://docs.fleetcore.com/crm/lead-priority",
        default_value: {
          priority_levels: ["low", "medium", "high", "urgent"],
          thresholds: {
            urgent: { min: 80, color: "#dc2626", label: "Urgent", order: 4 },
            high: { min: 70, color: "#ea580c", label: "High", order: 3 },
            medium: { min: 40, color: "#f59e0b", label: "Medium", order: 2 },
            low: { min: 0, color: "#22c55e", label: "Low", order: 1 },
          },
          default: "medium",
        },
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    logger.info(
      { setting_key: setting.setting_key },
      "✅ lead_priority_config created/updated"
    );

    // Verify
    const config = await prisma.crm_settings.findUnique({
      where: { setting_key: "lead_priority_config" },
      select: {
        setting_key: true,
        display_label: true,
        display_order: true,
        category: true,
        is_active: true,
      },
    });

    logger.info({ config }, "Priority config details");

    // Count all settings
    const settingsCount = await prisma.crm_settings.count();
    logger.info({ total_settings: settingsCount }, "Seeding completed");
  } catch (error) {
    logger.error({ error }, "Seed failed");
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void seedPriorityConfig();
