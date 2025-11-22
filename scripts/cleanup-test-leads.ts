import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function main() {
  const testEmails = [
    "mfodil@outlook.com",
    "mohamed.fodil@edu.escp.eu",
    "mohamed@bluewise.io",
  ];

  logger.info({ emails: testEmails }, "Cleaning up test leads");

  const result = await prisma.crm_leads.deleteMany({
    where: {
      email: {
        in: testEmails,
      },
    },
  });

  logger.info(
    { deletedCount: result.count },
    "Deleted test leads successfully"
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error({ error }, "Error deleting test leads");
  process.exit(1);
});
