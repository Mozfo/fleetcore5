/**
 * ============================================================================
 * ADMIN TEST USER CREDENTIALS - FOR PLAYWRIGHT MCP TESTING
 * ============================================================================
 *
 * Email:    admin@fleetcore.io
 * Password: FleetCore2024!
 * Org ID:   org_33cBkAws9Wm4RszSIOS5xYmkMe4
 *
 * Usage: pnpm exec tsx scripts/create-admin-user.ts
 *
 * This script creates/updates the admin user in Clerk for UI testing.
 * ============================================================================
 */
import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { logger } from "@/lib/logger";

// Load .env.local manually
import { config } from "dotenv";
config({ path: ".env.local" });

const ADMIN_EMAIL = "admin@fleetcore.io";
const ADMIN_PASSWORD = "FleetCore2024!";
const ADMIN_FIRST_NAME = "FleetCore";
const ADMIN_LAST_NAME = "Admin";
const ADMIN_ORG_ID =
  process.env.FLEETCORE_ADMIN_ORG_ID || "org_33cBkAws9Wm4RszSIOS5xYmkMe4";

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    logger.error("CLERK_SECRET_KEY is not set");
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });

  logger.info("Checking for existing user...");

  // Check if user already exists
  const existingUsers = await clerk.users.getUserList({
    emailAddress: [ADMIN_EMAIL],
  });

  let userId: string;

  if (existingUsers.data.length > 0) {
    userId = existingUsers.data[0].id;
    logger.info({ userId }, "User already exists");

    // Update password to ensure we know it
    await clerk.users.updateUser(userId, {
      password: ADMIN_PASSWORD,
    });
    logger.info("Password updated");
  } else {
    logger.info("Creating new admin user...");

    const user = await clerk.users.createUser({
      emailAddress: [ADMIN_EMAIL],
      password: ADMIN_PASSWORD,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      skipPasswordChecks: true,
    });

    userId = user.id;
    logger.info({ userId }, "User created");
  }

  // Check if org exists
  logger.info({ orgId: ADMIN_ORG_ID }, "Checking organization");

  try {
    const org = await clerk.organizations.getOrganization({
      organizationId: ADMIN_ORG_ID,
    });
    logger.info({ orgName: org.name }, "Organization found");

    // Check if user is member
    const memberships = await clerk.organizations.getOrganizationMembershipList(
      {
        organizationId: ADMIN_ORG_ID,
      }
    );

    const isMember = memberships.data.some(
      (m) => m.publicUserData?.userId === userId
    );

    if (!isMember) {
      logger.info("Adding user to organization as admin...");
      await clerk.organizations.createOrganizationMembership({
        organizationId: ADMIN_ORG_ID,
        userId,
        role: "org:admin",
      });
      logger.info("User added to organization");
    } else {
      logger.info("User is already a member");
    }
  } catch {
    logger.info("Organization not found, creating new one...");

    const org = await clerk.organizations.createOrganization({
      name: "FleetCore Admin",
      createdBy: userId,
    });

    logger.info({ orgId: org.id }, "Organization created");
    logger.warn(
      { newOrgId: org.id },
      "Update FLEETCORE_ADMIN_ORG_ID in .env.local"
    );
  }

  logger.info(
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      orgId: ADMIN_ORG_ID,
    },
    "ADMIN ACCOUNT READY"
  );
}

main().catch((err) => logger.error({ err }, "Script failed"));
