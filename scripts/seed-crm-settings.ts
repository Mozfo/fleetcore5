import { prisma } from "@/lib/prisma";
import { seedCrmSettings } from "@/lib/repositories/crm/settings.repository";

/**
 * Seed CRM Settings
 *
 * This script populates the crm_settings table with initial configuration
 * for lead scoring algorithms and assignment rules.
 *
 * Run: pnpm tsx scripts/seed-crm-settings.ts
 */
async function main() {
  try {
    const count = await seedCrmSettings(prisma);

    // Verify seeded settings
    const settings = await prisma.crm_settings.findMany({
      select: { setting_key: true, category: true },
      orderBy: { category: "asc" },
    });

    return { count, settings };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(({ count: _count, settings: _settings }) => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
