import { prisma } from "./prisma";

/**
 * Get organization currency based on country_code
 * UAE (AE) → AED, France (FR) → EUR
 */
export async function getOrgCurrency(tenantId: string): Promise<"AED" | "EUR"> {
  const org = await prisma.adm_tenants.findUniqueOrThrow({
    where: { id: tenantId },
    select: { country_code: true },
  });
  return org.country_code === "AE" ? "AED" : "EUR";
}

/**
 * Get organization country code
 */
export async function getOrgCountryCode(
  tenantId: string
): Promise<"AE" | "FR"> {
  const org = await prisma.adm_tenants.findUniqueOrThrow({
    where: { id: tenantId },
    select: { country_code: true },
  });
  return org.country_code as "AE" | "FR";
}

/**
 * Get complete organization with country/currency info
 */
export async function getOrgWithCountry(tenantId: string) {
  const org = await prisma.adm_tenants.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      country_code: true,
      subdomain: true,
    },
  });

  return {
    ...org,
    currency: org.country_code === "AE" ? ("AED" as const) : ("EUR" as const),
  };
}
