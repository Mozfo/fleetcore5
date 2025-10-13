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
