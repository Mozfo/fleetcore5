import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function count() {
  const count = await prisma.dir_notification_templates.count();
  return count;
}

count()
  .then((c) => {
    if (c > 0) process.exit(0);
    else process.exit(1);
  })
  .catch((_e) => {
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
