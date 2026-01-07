/**
 * Verification Validators - V6.2-8b
 *
 * Zod schemas for customer verification form after Stripe checkout.
 *
 * @module lib/validators/billing/verification.validators
 */

import { z } from "zod";

// ===== CGI/CGU VERSION =====

/**
 * Current CGI/CGU version
 * Format: YYYY-MM-DD (update this when terms change)
 * Example: "2026-01-07.r2" for revision 2 on same day
 */
export const CGI_VERSION = "2026-01-07";

// ===== REQUEST SCHEMAS =====

/**
 * Verification form submission schema
 *
 * Required fields:
 * - token: Verification token from email link
 * - company_legal_name: Official registered company name
 * - admin_name: Full name of designated admin
 * - admin_email: Email for admin invitation
 * - cgi_accepted: Must be true
 *
 * Optional fields:
 * - company_siret: French SIRET number (14 digits) or tax ID
 * - company_address: Full company address (JSON object)
 */
export const verificationSubmitSchema = z.object({
  // Token from verification email link
  token: z
    .string()
    .min(32, "Invalid verification token")
    .max(128, "Invalid verification token"),

  // Company information
  company_legal_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(255, "Company name must be at most 255 characters")
    .trim(),

  company_siret: z
    .string()
    .regex(/^[0-9]{14}$/, "SIRET must be exactly 14 digits")
    .optional()
    .nullable(),

  company_address: z
    .object({
      street: z.string().max(255).optional(),
      city: z.string().max(100).optional(),
      postal_code: z.string().max(20).optional(),
      country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
    })
    .optional()
    .nullable(),

  // Admin designation
  admin_name: z
    .string()
    .min(2, "Admin name must be at least 2 characters")
    .max(255, "Admin name must be at most 255 characters")
    .trim(),

  admin_email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters")
    .toLowerCase()
    .trim(),

  // CGI/CGU acceptance (must be true)
  cgi_accepted: z.literal(true, {
    message: "You must accept the Terms and Conditions",
  }),
});

/**
 * Token validation schema (for initial page load)
 */
export const verificationTokenSchema = z.object({
  token: z
    .string()
    .min(32, "Invalid verification token")
    .max(128, "Invalid verification token"),
});

// ===== RESPONSE TYPES =====

/**
 * Verification result
 */
export interface VerificationResult {
  success: boolean;
  tenantId?: string;
  tenantCode?: string;
  adminInvitationSent?: boolean;
  error?: string;
  errorCode?: VerificationErrorCode;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  tenantId?: string;
  tenantName?: string;
  tenantCode?: string;
  countryCode?: string;
  alreadyVerified?: boolean;
  expired?: boolean;
  error?: string;
  errorCode?: VerificationErrorCode;
}

/**
 * Error codes for verification
 */
export type VerificationErrorCode =
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "TOKEN_ALREADY_USED"
  | "TENANT_NOT_FOUND"
  | "CLERK_INVITATION_FAILED"
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR";

// ===== INFERRED TYPES =====

export type VerificationSubmitInput = z.infer<typeof verificationSubmitSchema>;
export type VerificationTokenInput = z.infer<typeof verificationTokenSchema>;
