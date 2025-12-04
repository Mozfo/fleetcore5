/**
 * JWT Authentication for FleetCore Internal APIs
 *
 * Standards:
 * - RFC 7519: JSON Web Token (JWT)
 * - RFC 6750: Bearer Token Usage
 *
 * Algorithm: HS256 (HMAC SHA-256)
 * Format: Authorization: Bearer <token>
 * Default Expiry: 1 hour
 */

import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { assertDefined } from "@/lib/core/errors";
import { logger } from "@/lib/logger";

// ===== INTERFACES =====

/**
 * FleetCore JWT Payload (RFC 7519 + custom claims)
 */
export interface FleetCoreJWTPayload {
  // Standard claims
  sub: string; // Subject: User ID
  iat: number; // Issued At: Unix timestamp
  exp: number; // Expiration: Unix timestamp
  iss: string; // Issuer: "fleetcore-api"
  aud: string; // Audience: "fleetcore-client"

  // FleetCore custom claims
  userId: string; // User ID (clarity)
  tenantId: string; // Multi-tenant isolation
  email?: string; // User email (optional)
  roles?: string[]; // RBAC roles
  isProviderEmployee?: boolean;
}

/**
 * Options for generating JWT tokens
 */
export interface GenerateTokenOptions {
  userId: string;
  tenantId: string;
  email?: string;
  roles?: string[];
  isProviderEmployee?: boolean;
  expiresIn?: string; // Default: "1h", formats: "30m", "7d", "2h"
}

/**
 * Result of JWT verification
 */
export interface VerifyTokenResult {
  valid: boolean;
  payload: FleetCoreJWTPayload | null;
  error?: string;
}

/**
 * Type guard for objects with code property
 */
interface ErrorWithCode {
  code?: string;
  message?: string;
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return typeof error === "object" && error !== null && "code" in error;
}

// ===== CORE FUNCTIONS =====

/**
 * Generate a signed JWT token (RFC 7519)
 *
 * @param options - Token generation options
 * @returns Signed JWT token string
 * @throws Error if INTERNAL_AUTH_SECRET is not set
 *
 * @example
 * const token = await generateToken({
 *   userId: 'user_123',
 *   tenantId: 'tenant_abc',
 *   email: 'user@example.com',
 *   expiresIn: '2h'
 * });
 */
export async function generateToken(
  options: GenerateTokenOptions
): Promise<string> {
  // LAZY validation (not at module load)
  const SECRET = assertDefined(
    process.env.INTERNAL_AUTH_SECRET,
    "INTERNAL_AUTH_SECRET environment variable is required. Generate with: openssl rand -base64 64"
  );
  const SECRET_KEY = new TextEncoder().encode(SECRET);

  const now = Math.floor(Date.now() / 1000);

  const payload: FleetCoreJWTPayload = {
    sub: options.userId,
    iat: now,
    exp: 0, // Set by jose via setExpirationTime()
    iss: "fleetcore-api",
    aud: "fleetcore-client",
    userId: options.userId,
    tenantId: options.tenantId,
    email: options.email,
    roles: options.roles || [],
    isProviderEmployee: options.isProviderEmployee || false,
  };

  // jose parses "1h", "30m" natively - NO parseExpiry() needed
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt(payload.iat)
    .setExpirationTime(options.expiresIn || "1h")
    .setIssuer(payload.iss)
    .setAudience(payload.aud)
    .sign(SECRET_KEY);
}

/**
 * Verify a JWT token signature and claims (RFC 7519)
 *
 * @param token - JWT token string to verify
 * @returns Verification result with payload or error
 * @throws Error if INTERNAL_AUTH_SECRET is not set
 *
 * @example
 * const result = await verifyToken(token);
 * if (result.valid) {
 *   // Access result.payload.userId
 * } else {
 *   // Handle result.error
 * }
 */
export async function verifyToken(token: string): Promise<VerifyTokenResult> {
  // LAZY validation (not at module load)
  const SECRET = assertDefined(
    process.env.INTERNAL_AUTH_SECRET,
    "INTERNAL_AUTH_SECRET environment variable is required"
  );
  const SECRET_KEY = new TextEncoder().encode(SECRET);

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: "fleetcore-api",
      audience: "fleetcore-client",
    });

    return {
      valid: true,
      payload: payload as unknown as FleetCoreJWTPayload,
    };
  } catch (error) {
    let errorMessage = "Unknown error";

    if (isErrorWithCode(error)) {
      const code = error.code;
      if (code === "ERR_JWT_EXPIRED") {
        errorMessage = "JWTExpired";
      } else if (code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
        errorMessage = "JWSSignatureVerificationFailed";
      }
    } else if (error instanceof Error && error.message.includes("expired")) {
      errorMessage = "JWTExpired";
    }

    return {
      valid: false,
      payload: null,
      error: errorMessage,
    };
  }
}

/**
 * Extract JWT token from Authorization header (RFC 6750)
 *
 * Expected format: "Authorization: Bearer <token>"
 *
 * @param request - Next.js request object
 * @returns Token string or null if not found/invalid format
 *
 * @example
 * const token = extractTokenFromHeader(request);
 * if (token) {
 *   const result = await verifyToken(token);
 * }
 */
export function extractTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  // RFC 6750: "Bearer" scheme (case-insensitive)
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  const token = parts[1].trim();

  return token || null;
}

// ===== INLINE TESTS =====
if (process.env.NODE_ENV === "test") {
  void (async () => {
    logger.info({}, "Running JWT inline tests...");

    // Test 1: Generate and verify valid token
    const token = await generateToken({
      userId: "user_test_123",
      tenantId: "tenant_test_abc",
      email: "test@example.com",
      roles: ["admin"],
    });
    const result = await verifyToken(token);
    if (result.valid !== true)
      throw new Error("Test 1 failed: Token should be valid");
    if (result.payload?.userId !== "user_test_123")
      throw new Error("Test 1 failed: UserId mismatch");
    if (result.payload?.tenantId !== "tenant_test_abc")
      throw new Error("Test 1 failed: TenantId mismatch");
    logger.info({}, "Test 1: Valid token generation and verification");

    // Test 2: Expired token
    const expiredToken = await generateToken({
      userId: "user_test",
      tenantId: "tenant_test",
      expiresIn: "1s",
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const expiredResult = await verifyToken(expiredToken);
    if (expiredResult.valid !== false)
      throw new Error("Test 2 failed: Expired token should be invalid");
    if (expiredResult.error !== "JWTExpired")
      throw new Error("Test 2 failed: Error should be JWTExpired");
    logger.info({}, "Test 2: Expired token rejection");

    // Test 3: Tampered token
    const validToken = await generateToken({
      userId: "user_test",
      tenantId: "tenant_test",
    });
    const tamperedToken = validToken.slice(0, -10) + "CORRUPTED!";
    const tamperedResult = await verifyToken(tamperedToken);
    if (tamperedResult.valid !== false)
      throw new Error("Test 3 failed: Tampered token should be invalid");
    logger.info({}, "Test 3: Tampered token rejection");

    // Test 4: Extract valid Bearer token
    const mockRequest = {
      headers: {
        get: (name: string) =>
          name === "authorization" ? "Bearer test_token_123" : null,
      },
    } as unknown as NextRequest;
    const extracted = extractTokenFromHeader(mockRequest);
    if (extracted !== "test_token_123")
      throw new Error("Test 4 failed: Should extract token correctly");
    logger.info({}, "Test 4: Bearer token extraction");

    // Test 5: Invalid Authorization header
    const mockRequestInvalid = {
      headers: {
        get: (name: string) =>
          name === "authorization" ? "InvalidFormat token" : null,
      },
    } as unknown as NextRequest;
    const extractedInvalid = extractTokenFromHeader(mockRequestInvalid);
    if (extractedInvalid !== null)
      throw new Error("Test 5 failed: Should return null for invalid format");
    logger.info({}, "Test 5: Invalid header format rejection");

    // Test 6: Missing Authorization header
    const mockRequestMissing = {
      headers: {
        get: () => null,
      },
    } as unknown as NextRequest;
    const extractedMissing = extractTokenFromHeader(mockRequestMissing);
    if (extractedMissing !== null)
      throw new Error("Test 6 failed: Should return null when header missing");
    logger.info({}, "Test 6: Missing header handling");

    logger.info({}, "All 6 JWT tests passed");
  })();
}
