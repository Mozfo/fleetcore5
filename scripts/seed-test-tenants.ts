/**
 * seed-test-tenants.ts — Create 2 test tenants for Phase 6I
 *
 * Creates:
 *   1. Alpha Transport (FR, EUR, Europe/Paris)
 *   2. Desert Fleet LLC (AE, AED, Asia/Dubai)
 *
 * Shared-ID pattern: auth_organization.id = adm_tenants.id
 *
 * Idempotent: safe to run multiple times.
 * Usage: pnpm exec tsx scripts/seed-test-tenants.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const log = (msg: string) => process.stdout.write(msg + "\n");

const TEST_TENANTS = [
  {
    name: "Alpha Transport",
    slug: "alpha-transport",
    countryCode: "FR",
    currency: "EUR",
    timezone: "Europe/Paris",
    tenantType: "client",
    status: "active",
    adminEmail: "admin@alpha-transport.test",
    adminName: "Pierre Dupont",
  },
  {
    name: "Desert Fleet LLC",
    slug: "desert-fleet",
    countryCode: "AE",
    currency: "AED",
    timezone: "Asia/Dubai",
    tenantType: "client",
    status: "active",
    adminEmail: "admin@desert-fleet.test",
    adminName: "Ahmed Al Rashid",
  },
];

async function main() {
  log("=== Seed Test Tenants ===\n");

  for (const t of TEST_TENANTS) {
    log(`Creating tenant: ${t.name}...`);

    // Check if org already exists by slug
    const existingOrg = await prisma.auth_organization.findFirst({
      where: { slug: t.slug },
    });

    let orgId: string;

    if (existingOrg) {
      orgId = existingOrg.id;
      log(`  auth_organization already exists: ${orgId}`);
    } else {
      orgId = crypto.randomUUID();
      await prisma.auth_organization.create({
        data: {
          id: orgId,
          name: t.name,
          slug: t.slug,
          created_at: new Date(),
        },
      });
      log(`  auth_organization created: ${orgId}`);
    }

    // Upsert adm_tenants (shared-ID)
    await prisma.adm_tenants.upsert({
      where: { id: orgId },
      update: {
        name: t.name,
        country_code: t.countryCode,
        default_currency: t.currency,
        timezone: t.timezone,
        tenant_type: t.tenantType,
        status: t.status as "active",
      },
      create: {
        id: orgId,
        name: t.name,
        country_code: t.countryCode,
        default_currency: t.currency,
        timezone: t.timezone,
        tenant_type: t.tenantType,
        status: t.status as "active",
        admin_email: t.adminEmail,
        admin_name: t.adminName,
      },
    });
    log(`  adm_tenants upserted`);

    // Create a test adm_members entry for the admin
    const existingMember = await prisma.adm_members.findFirst({
      where: { tenant_id: orgId, email: t.adminEmail },
    });

    if (existingMember) {
      log(`  adm_members already exists for ${t.adminEmail}`);
    } else {
      const nameParts = t.adminName.split(" ");
      const firstName = nameParts[0] ?? null;
      const lastName = nameParts.slice(1).join(" ") || null;

      await prisma.adm_members.create({
        data: {
          tenant_id: orgId,
          email: t.adminEmail,
          first_name: firstName,
          last_name: lastName,
          role: "admin",
          status: "active",
          preferred_language: t.countryCode === "FR" ? "fr" : "en",
        },
      });
      log(`  adm_members created for ${t.adminEmail}`);
    }

    log(`  Done: ${t.name}\n`);
  }

  log("=== All test tenants seeded ===");
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
