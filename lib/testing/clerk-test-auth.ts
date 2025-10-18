/**
 * Clerk Test Authentication Helper
 *
 * Production-ready helper module for generating valid Clerk JWT tokens
 * for automated API testing. Handles complete lifecycle:
 * - Test user creation
 * - Organization assignment
 * - Session creation
 * - JWT token generation
 * - Credentials caching (performance)
 * - Automatic cleanup
 *
 * @module lib/testing/clerk-test-auth
 * @requires @clerk/backend
 *
 * Usage:
 * ```typescript
 * import { createClerkTestAuth, cleanupClerkTestAuth } from '@/lib/testing/clerk-test-auth';
 *
 * const auth = await createClerkTestAuth();
 * // Use auth.token in fetch requests
 * await cleanupClerkTestAuth(auth);
 * ```
 */

import { createClerkClient } from "@clerk/backend";
import { logger } from "@/lib/logger";

// Initialize Clerk client for standalone Node.js environment (GitHub Actions)
// Uses CLERK_SECRET_KEY from environment variables
const getClerkClient = () => {
  const secretKey = process.env.CLERK_SECRET_KEY;

  // Debug: Log key presence and format (safe - no actual key value)
  if (!secretKey) {
    logger.error("CLERK_SECRET_KEY environment variable is not set");
    throw new Error("CLERK_SECRET_KEY environment variable is required");
  }

  const keyPrefix = secretKey.substring(0, 8);
  const keyLength = secretKey.length;
  logger.info({ keyPrefix, keyLength }, "Clerk client initialization");

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    logger.error(
      { keyPrefix },
      "CLERK_SECRET_KEY has invalid format (should start with sk_test_ or sk_live_)"
    );
    throw new Error("CLERK_SECRET_KEY has invalid format");
  }

  return createClerkClient({ secretKey });
};

/**
 * Clerk test authentication credentials
 */
export interface ClerkTestAuth {
  /** Test user ID created in Clerk */
  userId: string;

  /** Organization ID (tenant) */
  orgId: string;

  /** Session ID for the test user */
  sessionId: string;

  /** JWT token for authentication (Authorization: Bearer {token}) */
  token: string;

  /** Test user email (for debugging) */
  email: string;

  /** Token expiration timestamp (milliseconds) */
  expiresAt: number;

  /** Cleanup function to delete test user and session */
  cleanup: () => Promise<void>;
}

/**
 * Configuration for test auth creation
 */
export interface ClerkTestAuthConfig {
  /** Email prefix for test user (default: from env) */
  emailPrefix?: string;

  /** Password for test user (default: from env) */
  password?: string;

  /** First name (default: from env) */
  firstName?: string;

  /** Last name (default: from env) */
  lastName?: string;

  /** Organization name (default: from env) */
  orgName?: string;

  /** JWT template name (default: from env) */
  templateName?: string;

  /** Force new user creation (skip cache) */
  forceNew?: boolean;
}

/**
 * Cached credentials structure
 */
interface CachedCredentials {
  userId: string;
  orgId: string;
  sessionId: string;
  token: string;
  email: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Error types for better error handling
 */
export class ClerkTestAuthError extends Error {
  constructor(
    message: string,
    public code:
      | "USER_CREATION_FAILED"
      | "ORG_CREATION_FAILED"
      | "SESSION_CREATION_FAILED"
      | "TOKEN_GENERATION_FAILED"
      | "CLEANUP_FAILED"
      | "INVALID_CONFIG"
      | "TOKEN_EXPIRED"
      | "API_ERROR",
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ClerkTestAuthError";
  }
}

// In-memory cache (simple, no file I/O complexity)
let credentialsCache: CachedCredentials | null = null;

/**
 * Get default configuration from environment variables
 */
function getDefaultConfig(): Required<Omit<ClerkTestAuthConfig, "forceNew">> {
  const emailPrefix = process.env.TEST_USER_EMAIL_PREFIX || "test-fleetcore";
  const password = process.env.TEST_USER_PASSWORD || "TestP@ssw0rd123!";
  const firstName = process.env.TEST_USER_FIRST_NAME || "Test";
  const lastName = process.env.TEST_USER_LAST_NAME || "FleetCore";
  const orgName = process.env.TEST_ORG_NAME || "FleetCore Test Organization";
  const templateName = process.env.CLERK_JWT_TEMPLATE_NAME || "test-api";

  return {
    emailPrefix,
    password,
    firstName,
    lastName,
    orgName,
    templateName,
  };
}

/**
 * Check if cached credentials are still valid
 */
function isCacheValid(): boolean {
  if (!credentialsCache) return false;

  const now = Date.now();
  const cacheDuration = parseInt(
    process.env.TEST_CREDENTIALS_CACHE_DURATION || "3600000"
  ); // 1 hour default
  const isNotExpired = now < credentialsCache.expiresAt;
  const isFresh = now - credentialsCache.createdAt < cacheDuration;

  return isNotExpired && isFresh;
}

/**
 * Create a test user in Clerk
 */
async function createTestUser(
  config: Required<Omit<ClerkTestAuthConfig, "forceNew">>
): Promise<{ userId: string; email: string }> {
  try {
    const timestamp = Date.now();
    const email = `${config.emailPrefix}-${timestamp}@example.com`;

    logger.info({ email }, "Creating test user in Clerk");

    const client = getClerkClient();
    const user = await client.users.createUser({
      emailAddress: [email],
      password: config.password,
      firstName: config.firstName,
      lastName: config.lastName,
      skipPasswordChecks: true,
      skipPasswordRequirement: false,
    });

    logger.info({ userId: user.id, email }, "Test user created successfully");

    return {
      userId: user.id,
      email,
    };
  } catch (error) {
    logger.error({ error }, "Failed to create test user");
    throw new ClerkTestAuthError(
      "Failed to create test user in Clerk",
      "USER_CREATION_FAILED",
      error
    );
  }
}

/**
 * Create or get organization for test user
 */
async function createOrGetOrganization(
  userId: string,
  orgName: string
): Promise<string> {
  try {
    logger.info({ userId, orgName }, "Creating/getting organization");

    const client = getClerkClient();

    // Try to find existing test organization first (to reuse if possible)
    const orgs = await client.organizations.getOrganizationList({
      query: orgName,
      limit: 1,
    });

    let orgId: string;

    if (orgs.data.length > 0) {
      orgId = orgs.data[0].id;
      logger.info({ orgId }, "Reusing existing organization");

      // Add user to existing org
      await client.organizations.createOrganizationMembership({
        organizationId: orgId,
        userId,
        role: "org:member",
      });
    } else {
      // Create new organization
      const org = await client.organizations.createOrganization({
        name: orgName,
        createdBy: userId,
      });
      orgId = org.id;
      logger.info({ orgId }, "Created new organization");
    }

    return orgId;
  } catch (error) {
    logger.error({ error, userId }, "Failed to create/get organization");
    throw new ClerkTestAuthError(
      "Failed to create or get organization",
      "ORG_CREATION_FAILED",
      error
    );
  }
}

/**
 * Create a session for the test user with active organization
 * Note: POST /sessions is only available in test environments (sk_test_ keys)
 */
async function createTestSession(
  userId: string,
  orgId: string
): Promise<string> {
  try {
    logger.info(
      { userId, orgId },
      "Creating test session with active organization"
    );

    // Use direct Backend API call since JS SDK doesn't expose createSession
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey || !secretKey.startsWith("sk_test_")) {
      throw new ClerkTestAuthError(
        "CLERK_SECRET_KEY must be a test key (sk_test_...) to create sessions programmatically",
        "INVALID_CONFIG"
      );
    }

    // Clerk Backend API base URL
    const baseUrl = "https://api.clerk.com/v1";

    // Try with actor parameter to set active organization
    const requestBody = {
      user_id: userId,
      actor: {
        sub: userId,
        org_id: orgId,
      },
    };

    logger.info({ requestBody }, "Sending session creation request");

    const response = await fetch(`${baseUrl}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.warn(
        { error, status: response.status },
        "Session creation with actor failed, retrying without actor"
      );

      // Fallback: Try without actor parameter
      const fallbackResponse = await fetch(`${baseUrl}/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        throw new Error(
          `Clerk API error: ${fallbackResponse.status} - ${fallbackError}`
        );
      }

      const session = (await fallbackResponse.json()) as { id: string };
      logger.info(
        { sessionId: session.id },
        "Test session created (without actor)"
      );
      return session.id;
    }

    const session = (await response.json()) as { id: string };

    logger.info(
      { sessionId: session.id },
      "Test session created successfully with active organization"
    );

    return session.id;
  } catch (error) {
    logger.error({ error, userId, orgId }, "Failed to create test session");
    throw new ClerkTestAuthError(
      "Failed to create test session",
      "SESSION_CREATION_FAILED",
      error
    );
  }
}

/**
 * Generate JWT token for the session using specified template
 */
async function generateToken(
  sessionId: string,
  templateName: string
): Promise<{ token: string; expiresAt: number }> {
  try {
    logger.info({ sessionId, templateName }, "Generating JWT token");

    const client = getClerkClient();
    const tokenResponse = await client.sessions.getToken(
      sessionId,
      templateName
    );

    // Extract JWT from response (Clerk returns { jwt: "..." } object, not plain string)
    let token: string | null = null;

    if (
      typeof tokenResponse === "object" &&
      tokenResponse !== null &&
      "jwt" in tokenResponse
    ) {
      token = (tokenResponse as { jwt: string }).jwt;
    } else if (typeof tokenResponse === "string") {
      token = tokenResponse;
    }

    if (!token) {
      throw new Error(
        `Invalid token response from Clerk. Type: ${typeof tokenResponse}, Value: ${JSON.stringify(tokenResponse)}`
      );
    }

    // Calculate expiration (24 hours from now based on template config)
    const tokenLifetime = parseInt(
      process.env.CLERK_TEST_TOKEN_LIFETIME || "86400"
    ); // 24h default
    const expiresAt = Date.now() + tokenLifetime * 1000;

    logger.info(
      { sessionId, expiresAt: new Date(expiresAt).toISOString() },
      "JWT token generated successfully"
    );

    return {
      token,
      expiresAt,
    };
  } catch (error) {
    logger.error(
      { error, sessionId, templateName },
      "Failed to generate JWT token"
    );
    throw new ClerkTestAuthError(
      `Failed to generate JWT token with template '${templateName}'`,
      "TOKEN_GENERATION_FAILED",
      error
    );
  }
}

/**
 * Main function: Create complete test authentication credentials
 *
 * This function orchestrates the entire flow:
 * 1. Check cache for valid existing credentials (performance optimization)
 * 2. Create test user in Clerk
 * 3. Create/assign organization (tenant)
 * 4. Create session for user
 * 5. Generate JWT token
 * 6. Return credentials with cleanup function
 *
 * @param config - Optional configuration (uses env vars by default)
 * @returns ClerkTestAuth object with token and cleanup function
 * @throws ClerkTestAuthError if any step fails
 *
 * @example
 * ```typescript
 * const auth = await createClerkTestAuth();
 *
 * // Use in fetch requests
 * const response = await fetch('http://localhost:3000/api/v1/drivers', {
 *   headers: {
 *     'Authorization': `Bearer ${auth.token}`,
 *   },
 * });
 *
 * // Cleanup when done
 * await auth.cleanup();
 * ```
 */
export async function createClerkTestAuth(
  config: ClerkTestAuthConfig = {}
): Promise<ClerkTestAuth> {
  const startTime = Date.now();

  try {
    // Check cache unless forceNew is true
    if (!config.forceNew && isCacheValid() && credentialsCache) {
      logger.info("Reusing cached test credentials (performance optimization)");
      const cached = credentialsCache;

      return {
        userId: cached.userId,
        orgId: cached.orgId,
        sessionId: cached.sessionId,
        token: cached.token,
        email: cached.email,
        expiresAt: cached.expiresAt,
        cleanup: async () =>
          cleanupClerkTestAuth({
            userId: cached.userId,
            orgId: cached.orgId,
            sessionId: cached.sessionId,
            token: cached.token,
            email: cached.email,
            expiresAt: cached.expiresAt,
            cleanup: async () => {},
          }),
      };
    }

    const fullConfig = { ...getDefaultConfig(), ...config };

    logger.info("Creating new Clerk test authentication credentials");

    // Step 1: Create test user
    const { userId, email } = await createTestUser(fullConfig);

    // Step 2: Create/get organization
    const orgId = await createOrGetOrganization(userId, fullConfig.orgName);

    // Step 3: Create session with active organization
    const sessionId = await createTestSession(userId, orgId);

    // Step 4: Generate JWT token
    const { token, expiresAt } = await generateToken(
      sessionId,
      fullConfig.templateName
    );

    // Cache credentials
    credentialsCache = {
      userId,
      orgId,
      sessionId,
      token,
      email,
      expiresAt,
      createdAt: Date.now(),
    };

    const duration = Date.now() - startTime;
    logger.info(
      { userId, orgId, email, duration: `${duration}ms` },
      "Clerk test credentials created successfully"
    );

    return {
      userId,
      orgId,
      sessionId,
      token,
      email,
      expiresAt,
      cleanup: async () =>
        cleanupClerkTestAuth({
          userId,
          orgId,
          sessionId,
          token,
          email,
          expiresAt,
          cleanup: async () => {},
        }),
    };
  } catch (error) {
    logger.error(
      { error, duration: `${Date.now() - startTime}ms` },
      "Failed to create Clerk test credentials"
    );
    throw error instanceof ClerkTestAuthError
      ? error
      : new ClerkTestAuthError(
          "Unexpected error during test credentials creation",
          "API_ERROR",
          error
        );
  }
}

/**
 * Cleanup test credentials (delete user, invalidate cache)
 *
 * @param auth - ClerkTestAuth object to cleanup
 */
export async function cleanupClerkTestAuth(auth: ClerkTestAuth): Promise<void> {
  try {
    logger.info(
      { userId: auth.userId, email: auth.email },
      "Cleaning up test credentials"
    );

    const client = getClerkClient();

    // Delete test user (cascades to sessions and org memberships)
    await client.users.deleteUser(auth.userId);

    // Invalidate cache if it matches this auth
    if (credentialsCache?.userId === auth.userId) {
      credentialsCache = null;
    }

    logger.info(
      { userId: auth.userId },
      "Test credentials cleaned up successfully"
    );
  } catch (error) {
    logger.error(
      { error, userId: auth.userId },
      "Failed to cleanup test credentials"
    );
    throw new ClerkTestAuthError(
      "Failed to cleanup test credentials",
      "CLEANUP_FAILED",
      error
    );
  }
}

/**
 * Validate that a token is still valid (not expired)
 */
export function isTokenValid(auth: ClerkTestAuth): boolean {
  return Date.now() < auth.expiresAt;
}

/**
 * Clear credentials cache (force new credentials on next call)
 */
export function clearCache(): void {
  credentialsCache = null;
  logger.info("Test credentials cache cleared");
}
