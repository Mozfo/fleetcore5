/**
 * seed-auth.ts — Bootstrap Better Auth for FleetCore
 *
 * Creates:
 *   1. auth_user "system" (bootstrap inviter — cannot login)
 *   2. auth_organization HQ (shared-ID = adm_tenants.id = adm_providers.id)
 *   3. auth_member system -> HQ
 *   4. auth_invitation for CEO
 *
 * HQ provider resolved via: is_headquarters column on adm_providers
 * (DB column added via raw migration, NOT in Prisma schema)
 *
 * CEO resolved via: first active non-system employee on HQ provider
 *
 * Idempotent: safe to run multiple times.
 * Usage: pnpm exec tsx scripts/seed-auth.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const log = (msg: string) => process.stdout.write(msg + "\n");

// System employee ID — well-known zero UUID from adm_provider_employees seed
const SYSTEM_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  log("=== FleetCore Auth Seed ===\n");

  // ── Resolve HQ tenant ID from DB ─────────────────────────────────────────
  // is_headquarters is a DB column on adm_providers (not in Prisma schema)
  log("Resolving HQ provider...");
  const hqRows = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
    "SELECT id, name FROM adm_providers WHERE is_headquarters = true LIMIT 1"
  );
  const hq = hqRows[0];
  if (!hq) throw new Error("No HQ provider found (is_headquarters=true)");
  const hqId = hq.id;
  log("  HQ: " + hq.name + " (" + hqId + ")");

  // ── Resolve CEO email from DB ────────────────────────────────────────────
  log("Resolving CEO...");
  const ceo = await prisma.adm_provider_employees.findFirst({
    where: {
      provider_id: hqId,
      status: "active",
      deleted_at: null,
      email: { not: { contains: "fleetcore.internal" } },
    },
    select: { id: true, email: true },
  });
  if (!ceo) throw new Error("No active employee on HQ provider");
  log("  CEO: " + ceo.email + " (" + ceo.id + ")");

  // ── STEP 1: System auth_user ─────────────────────────────────────────────
  log("\nSTEP 1: System auth_user...");
  const existingUser = await prisma.auth_user.findUnique({
    where: { id: SYSTEM_ID },
  });
  if (existingUser) {
    log("  SKIP — already exists");
  } else {
    await prisma.auth_user.create({
      data: {
        id: SYSTEM_ID,
        name: "System",
        email: "system@fleetcore.internal",
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    log("  CREATED");
  }

  // ── STEP 2: HQ auth_organization ─────────────────────────────────────────
  log("\nSTEP 2: HQ auth_organization...");
  const existingOrg = await prisma.auth_organization.findUnique({
    where: { id: hqId },
  });
  if (existingOrg) {
    log("  SKIP — already exists (metadata=" + existingOrg.metadata + ")");
  } else {
    const meta = JSON.stringify({ is_headquarters: true });
    await prisma.auth_organization.create({
      data: {
        id: hqId,
        name: hq.name,
        slug: hq.name.toLowerCase().replace(/\s+/g, "-"),
        metadata: meta,
        created_at: new Date(),
      },
    });
    log("  CREATED — metadata=" + meta);
  }

  // ── STEP 3: System -> HQ auth_member ─────────────────────────────────────
  log("\nSTEP 3: System -> HQ auth_member...");
  const existingMember = await prisma.auth_member.findFirst({
    where: { user_id: SYSTEM_ID, organization_id: hqId },
  });
  if (existingMember) {
    log("  SKIP — already exists");
  } else {
    await prisma.auth_member.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: hqId,
        user_id: SYSTEM_ID,
        role: "org:adm_admin",
        created_at: new Date(),
      },
    });
    log("  CREATED");
  }

  // ── STEP 4: CEO invitation ───────────────────────────────────────────────
  log("\nSTEP 4: CEO invitation...");
  const existingInv = await prisma.auth_invitation.findFirst({
    where: { email: ceo.email, organization_id: hqId, status: "pending" },
  });
  if (existingInv) {
    log("  SKIP — pending invitation exists");
    log("\n  INVITATION URL:");
    log("  http://localhost:3000/en/accept-invitation?id=" + existingInv.id);
  } else {
    const invId = crypto.randomUUID();
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);
    await prisma.auth_invitation.create({
      data: {
        id: invId,
        organization_id: hqId,
        email: ceo.email,
        role: "org:adm_admin",
        status: "pending",
        expires_at: expiresAt,
        inviter_id: SYSTEM_ID,
        created_at: new Date(),
      },
    });
    log("  CREATED — email=" + ceo.email + " role=owner");
    log("\n  INVITATION URL:");
    log("  http://localhost:3000/en/accept-invitation?id=" + invId);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  log("\n=== SUMMARY ===");
  const counts = {
    users: await prisma.auth_user.count(),
    orgs: await prisma.auth_organization.count(),
    members: await prisma.auth_member.count(),
    invs: await prisma.auth_invitation.count({ where: { status: "pending" } }),
  };
  log("  auth_user:         " + counts.users);
  log("  auth_organization: " + counts.orgs);
  log("  auth_member:       " + counts.members);
  log("  auth_invitation:   " + counts.invs + " pending");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  process.stderr.write("SEED ERROR: " + String(e) + "\n");
  await prisma.$disconnect();
  process.exit(1);
});
