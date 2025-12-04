import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUAE() {
  const uae = await prisma.crm_countries.findUnique({
    where: { country_code: "AE" },
  });

  console.log("\n=== UAE (AE) Configuration ===");
  console.log(JSON.stringify(uae, null, 2));

  await prisma.$disconnect();
}

checkUAE()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
