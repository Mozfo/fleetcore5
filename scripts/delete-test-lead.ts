import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function main() {
  const email = "mohamed@bluewise.io";

  // Find all leads with this email
  const existingLeads = await prisma.crm_leads.findMany({
    where: {
      email: email,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      country_code: true,
      created_at: true,
      deleted_at: true,
    },
  });

  logger.info(
    { count: existingLeads.length, leads: existingLeads },
    "Found leads"
  );

  if (existingLeads.length === 0) {
    logger.info("No leads found to delete");
    await prisma.$disconnect();
    return;
  }

  // Delete all leads with this email
  const result = await prisma.crm_leads.deleteMany({
    where: {
      email: email,
    },
  });

  logger.info({ deletedCount: result.count }, "Deleted leads successfully");

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error({ error }, "Error deleting leads");
  process.exit(1);
});
