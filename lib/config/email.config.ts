/**
 * Email Configuration
 *
 * Single source of truth for all email settings.
 * Change here = change everywhere.
 *
 * @module lib/config/email.config
 */

// ============================================================================
// EMAIL SENDER
// ============================================================================

/**
 * Default sender email address
 * Override via EMAIL_FROM environment variable
 */
export const EMAIL_FROM_ADDRESS =
  process.env.EMAIL_FROM || "support@fleetcore.io";

/**
 * Default sender name
 * Override via EMAIL_FROM_NAME environment variable
 */
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "FleetCore";

/**
 * Full "From" header: "FleetCore <support@fleetcore.io>"
 */
export const EMAIL_FROM = `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`;

// ============================================================================
// REPLY-TO
// ============================================================================

/**
 * Reply-to email address
 * Override via EMAIL_REPLY_TO environment variable
 */
export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO || "support@fleetcore.io";

// ============================================================================
// SUPPORT CONTACT
// ============================================================================

/**
 * Support email shown in email templates
 */
export const SUPPORT_EMAIL = EMAIL_FROM_ADDRESS;
