/**
 * Token Generation Utilities
 *
 * V6.5 - Shared token generation for reschedule URLs
 *
 * @module lib/utils/token
 */

// ============================================================================
// SHORT TOKEN GENERATION
// ============================================================================

/**
 * Alphabet for token generation (alphanumeric, URL-safe)
 */
const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Generate a short alphanumeric token for iOS Mail compatible URLs
 *
 * Used for:
 * - reschedule_token in crm_leads (short URL /r/{token})
 *
 * @param length - Token length (default: 6)
 * @returns Random alphanumeric token
 *
 * @example
 * generateShortToken() // "Xk9mP2"
 * generateShortToken(8) // "Xk9mP2aB"
 */
export function generateShortToken(length = 6): string {
  let token = "";
  for (let i = 0; i < length; i++) {
    token += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return token;
}
