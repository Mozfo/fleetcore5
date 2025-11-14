import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function main() {
  const countries = await prisma.crm_countries.findMany({
    where: {
      country_code: {
        in: ["ES", "AE"],
      },
    },
    select: {
      country_code: true,
      country_name_en: true,
      is_operational: true,
      is_visible: true,
      notification_locale: true,
    },
    orderBy: {
      country_code: "asc",
    },
  });

  logger.info({ countries }, "Countries check");

  const es = countries.find((c) => c.country_code === "ES");
  if (!es) {
    logger.error("ES not found");
    process.exit(1);
  } else {
    logger.info({ es }, "ES found");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error({ error }, "Error");
  process.exit(1);
});
