import { prisma } from "./prisma";

/**
 * Get organization currency from adm_tenants.default_currency
 *
 * Reads the configured default_currency for the tenant.
 * This is the source of truth for all CRM currency operations.
 *
 * @param tenantId - UUID of the tenant
 * @returns Currency code (e.g., "EUR", "AED", "USD")
 */
export async function getOrgCurrency(tenantId: string): Promise<string> {
  const org = await prisma.adm_tenants.findUniqueOrThrow({
    where: { id: tenantId },
    select: { default_currency: true },
  });
  return org.default_currency;
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
 *
 * Returns tenant details including the configured default_currency.
 */
export async function getOrgWithCountry(tenantId: string) {
  const org = await prisma.adm_tenants.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      country_code: true,
      subdomain: true,
      default_currency: true,
    },
  });

  return {
    ...org,
    currency: org.default_currency,
  };
}
