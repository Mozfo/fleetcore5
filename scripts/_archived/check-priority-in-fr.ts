import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const template = await prisma.dir_notification_templates.findFirst({
    where: {
      template_code: "sales_rep_assignment",
      channel: "email",
    },
    select: {
      body_translations: true,
    },
  });

  const body = (template?.body_translations as Record<string, string>).fr;

  if (body.includes("{{priority}}")) {
    process.stdout.write("✅ {{priority}} PRESENT\n");
  } else if (body.includes("haute")) {
    process.stdout.write('❌ "haute" hardcodé trouvé\n');
  } else {
    process.stdout.write('⚠️  Ni {{priority}} ni "haute" trouvé\n');
  }

  await prisma.$disconnect();
}

void check();
