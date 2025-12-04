import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function main() {
  const email = "mohamed@bluewise.io";

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
    orderBy: {
      created_at: "desc",
    },
  });

  logger.info(
    { count: existingLeads.length, leads: existingLeads },
    "Existing leads"
  );

  if (existingLeads.length > 0) {
    logger.warn("Duplicate email found - may cause UNIQUE constraint error");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error({ error }, "Error");
  process.exit(1);
});
