/**
 * seed-test-users.ts — Create 3 test users with login capability
 *
 * Pattern: same as scripts/seed-auth.ts (Prisma direct, no lib/ imports)
 * Password hash: Node.js crypto scryptSync (same format as Better Auth)
 *
 * Usage: dotenv -e .env.local -- tsx scripts/seed-test-users.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "crypto";

const prisma = new PrismaClient();
const log = (msg: string) => process.stdout.write(msg + "\n");

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

const PASSWORD = "FleetCore2026!";

const TEST_USERS = [
  {
    email: "pierre@alpha-transport.test",
    name: "Pierre Dupont",
    tenantCode: "C-BW87BP",
    role: "admin",
  },
  {
    email: "ahmed@desert-fleet.test",
    name: "Ahmed Al Rashid",
    tenantCode: "C-8VGYBC",
    role: "admin",
  },
  {
    email: "testuser@fleetcore.test",
    name: "Test User",
    tenantCode: "C-07EGHT",
    role: "member",
  },
];

async function main() {
  log("=== Seed Test Users ===\n");

  for (const u of TEST_USERS) {
    log("--- " + u.email + " ---");

    // 1. Resolve tenant
    const tenant = await prisma.adm_tenants.findFirst({
      where: { tenant_code: u.tenantCode, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!tenant) {
      log("  ERROR: tenant " + u.tenantCode + " not found — skipping");
      continue;
    }
    log("  Tenant: " + tenant.name);

    // 2. Check if auth_user already exists
    const existingUser = await prisma.auth_user.findFirst({
      where: { email: u.email },
    });
    if (existingUser) {
      log("  SKIP — auth_user already exists: " + existingUser.id);
      continue;
    }

    // 3. Create auth_user
    const userId = crypto.randomUUID();
    await prisma.auth_user.create({
      data: {
        id: userId,
        name: u.name,
        email: u.email,
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    log("  auth_user: " + userId);

    // 4. Create auth_account (credential provider with hashed password)
    const hashedPw = hashPassword(PASSWORD);
    await prisma.auth_account.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        account_id: userId,
        provider_id: "credential",
        password: hashedPw,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    log("  auth_account: credential created");

    // 5. Create auth_member (org link)
    const orgRole = u.role === "admin" ? "org:adm_admin" : "member";
    await prisma.auth_member.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: tenant.id,
        user_id: userId,
        role: orgRole,
        created_at: new Date(),
      },
    });
    log("  auth_member: " + orgRole + " -> " + tenant.name);

    // 6. Create adm_members (business layer)
    const nameParts = u.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");
    await prisma.adm_members.create({
      data: {
        email: u.email,
        first_name: firstName,
        last_name: lastName,
        role: u.role,
        status: "active",
        auth_user_id: userId,
        tenant_id: tenant.id,
      },
    });
    log("  adm_members: linked\n");
  }

  // Verification
  log("=== VERIFICATION ===");
  const members = await prisma.adm_members.findMany({
    where: { deleted_at: null },
    select: {
      email: true,
      role: true,
      status: true,
      auth_user_id: true,
      adm_tenants: { select: { name: true } },
    },
    orderBy: { email: "asc" },
  });
  for (const m of members) {
    const auth = m.auth_user_id ? "YES" : "NO";
    log(
      m.email +
        " | " +
        m.role +
        " | " +
        m.status +
        " | auth:" +
        auth +
        " | " +
        m.adm_tenants.name
    );
  }

  await prisma.$disconnect();
  log("\nDone.");
}

main().catch(async (e) => {
  process.stderr.write("SEED ERROR: " + String(e) + "\n");
  await prisma.$disconnect();
  process.exit(1);
});
