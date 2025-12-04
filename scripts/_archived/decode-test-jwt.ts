/**
 * Diagnostic Script: Decode JWT Token from Test Credentials
 *
 * This script creates test credentials and decodes the JWT token
 * to verify that organization claims are present.
 */

import {
  createClerkTestAuth,
  cleanupClerkTestAuth,
} from "@/lib/testing/clerk-test-auth";
import { logger } from "@/lib/logger";

async function decodeJWT() {
  logger.info("Creating test credentials...");

  const auth = await createClerkTestAuth();

  logger.info(
    {
      userId: auth.userId,
      orgId: auth.orgId,
      email: auth.email,
    },
    "Test credentials created"
  );

  // Decode JWT token
  const parts = auth.token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  // Decode header
  const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
  logger.info({ header }, "JWT Header");

  // Decode payload
  const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
  logger.info({ payload }, "JWT Payload");

  // Check for organization claims
  const hasOrgId = "orgId" in payload;
  const hasOrgRole = "orgRole" in payload;
  const hasOrgSlug = "orgSlug" in payload;

  logger.info(
    {
      hasOrgId,
      hasOrgRole,
      hasOrgSlug,
      orgIdValue: payload.orgId || "NOT PRESENT",
      orgRoleValue: payload.orgRole || "NOT PRESENT",
      orgSlugValue: payload.orgSlug || "NOT PRESENT",
    },
    "Organization Claims Check"
  );

  if (!hasOrgId) {
    logger.error("❌ CRITICAL: JWT token does not contain 'orgId' claim!");
    logger.error("The JWT template needs to be configured with custom claims.");
    logger.error("Expected claims: userId, email, orgId, orgRole, orgSlug");
  } else {
    logger.info("✅ JWT token contains organization claims");
  }

  // Cleanup
  await cleanupClerkTestAuth(auth);
  logger.info("Test credentials cleaned up");
}

decodeJWT().catch((error) => {
  logger.error({ error }, "Failed to decode JWT");
  process.exit(1);
});
