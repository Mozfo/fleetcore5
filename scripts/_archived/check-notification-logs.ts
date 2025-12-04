import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

async function checkNotificationLogs() {
  logger.info("📋 Checking notification logs for mohamed@bluewise.io\n");

  const logs = await prisma.adm_notification_logs.findMany({
    where: {
      recipient_email: "mohamed@bluewise.io",
    },
    select: {
      id: true,
      recipient_email: true,
      template_code: true,
      status: true,
      error_message: true,
      external_id: true,
      created_at: true,
      locale_used: true,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 10,
  });

  logger.info(`Found ${logs.length} notification logs:\n`);

  logs.forEach((log, index) => {
    logger.info(`${index + 1}. ${log.template_code} (${log.locale_used})`);
    logger.info(`   Status: ${log.status}`);
    logger.info(`   External ID: ${log.external_id || "N/A"}`);
    logger.info(`   Created: ${log.created_at}`);
    if (log.error_message) {
      logger.error(`   Error: ${log.error_message}`);
    }
    logger.info("");
  });

  await prisma.$disconnect();
}

checkNotificationLogs()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ error }, "Failed to check logs");
    process.exit(1);
  });
