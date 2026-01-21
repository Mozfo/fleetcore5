/**
 * Preview BookingConfirmation Email
 *
 * Generates HTML files for visual verification before deployment.
 * Opens in browser to test mobile/desktop rendering.
 *
 * Usage: pnpm tsx scripts/preview-booking-confirmation.ts
 *
 * Output: scripts/output/booking-confirmation-{locale}.html
 */

import { render } from "@react-email/render";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { BookingConfirmation } from "@/emails/templates/BookingConfirmation";
import { logger } from "@/lib/logger";
import type { EmailLocale } from "@/lib/i18n/email-translations";

const OUTPUT_DIR = join(__dirname, "output");

// Test data
const TEST_DATA = {
  firstName: "Mohamed",
  bookingDate: "Mercredi 22 janvier 2026",
  bookingTime: "14:30",
  timezone: "GMT+1",
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  rescheduleUrl: "https://fleetcore.io/fr/r/Xk9mP2",
  cancelUrl: "https://fleetcore.io/fr/r/Xk9mP2",
};

const LOCALES: EmailLocale[] = ["en", "fr", "ar"];

async function generatePreviews(): Promise<void> {
  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  logger.info("Generating BookingConfirmation email previews...");

  for (const locale of LOCALES) {
    const html = await render(
      BookingConfirmation({
        locale,
        ...TEST_DATA,
      })
    );

    const filename = `booking-confirmation-${locale}.html`;
    const filepath = join(OUTPUT_DIR, filename);
    writeFileSync(filepath, html);

    logger.info({ filepath }, `Generated preview for locale: ${locale}`);
  }

  logger.info({ outputDir: OUTPUT_DIR }, "All previews generated");
}

generatePreviews().catch((err) => {
  logger.error({ err }, "Preview generation failed");
  process.exit(1);
});
