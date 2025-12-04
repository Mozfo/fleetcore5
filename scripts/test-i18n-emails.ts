/**
 * Test i18n Email Templates
 * Sends 6 emails: LeadConfirmation + MemberWelcome × (EN, FR, AR)
 */

import { render } from "@react-email/render";
import { Resend } from "resend";
import { LeadConfirmation } from "@/emails/templates/LeadConfirmation";
import { MemberWelcome } from "@/emails/templates/MemberWelcome";
import { logger } from "@/lib/logger";
import type { EmailLocale } from "@/lib/i18n/email-translations";

const resend = new Resend(process.env.RESEND_API_KEY);
const TEST_EMAIL = process.env.TEST_EMAIL || "mohamed@bluewise.io";

const LOCALES: EmailLocale[] = ["en", "fr", "ar"];

async function sendTestEmails(): Promise<void> {
  logger.info({ email: TEST_EMAIL }, "Sending 6 test emails");

  const results: Array<{
    template: string;
    locale: string;
    success: boolean;
    id?: string;
  }> = [];

  // LeadConfirmation in 3 locales
  for (const locale of LOCALES) {
    logger.info({ template: "LeadConfirmation", locale }, "Sending email");

    const html = await render(
      LeadConfirmation({
        locale,
        first_name:
          locale === "ar" ? "محمد" : locale === "fr" ? "Jean" : "John",
        company_name:
          locale === "ar"
            ? "شركة الأسطول"
            : locale === "fr"
              ? "FlotteMax"
              : "FleetCorp",
        fleet_size: "50-100",
        country_preposition:
          locale === "ar" ? "في" : locale === "fr" ? "en" : "in",
        country_name:
          locale === "ar"
            ? "الإمارات"
            : locale === "fr"
              ? "France"
              : "United States",
        phone_row: "+1 555 123 4567",
        message_row:
          locale === "ar"
            ? "مهتم بالعرض التوضيحي"
            : locale === "fr"
              ? "Intéressé par une démo"
              : "Interested in a demo",
      })
    );

    try {
      const { data, error } = await resend.emails.send({
        from: "FleetCore <noreply@fleetcore.io>",
        to: TEST_EMAIL,
        subject: `[TEST] Lead Confirmation - ${locale.toUpperCase()}`,
        html,
      });

      if (error) {
        logger.error({ error: error.message }, "Email send failed");
        results.push({ template: "LeadConfirmation", locale, success: false });
      } else {
        logger.info({ id: data?.id }, "Email sent");
        results.push({
          template: "LeadConfirmation",
          locale,
          success: true,
          id: data?.id,
        });
      }
    } catch (err) {
      logger.error({ err }, "Email send exception");
      results.push({ template: "LeadConfirmation", locale, success: false });
    }
  }

  // MemberWelcome in 3 locales
  for (const locale of LOCALES) {
    logger.info({ template: "MemberWelcome", locale }, "Sending email");

    const html = await render(
      MemberWelcome({
        locale,
        first_name:
          locale === "ar" ? "أحمد" : locale === "fr" ? "Marie" : "Alice",
        tenant_name:
          locale === "ar"
            ? "أسطول دبي"
            : locale === "fr"
              ? "FlotteParis"
              : "NYC Fleet",
        email: "test@example.com",
        role:
          locale === "ar"
            ? "مدير الأسطول"
            : locale === "fr"
              ? "Gestionnaire"
              : "Fleet Manager",
        dashboard_url: "https://app.fleetcore.com/dashboard",
      })
    );

    try {
      const { data, error } = await resend.emails.send({
        from: "FleetCore <noreply@fleetcore.io>",
        to: TEST_EMAIL,
        subject: `[TEST] Member Welcome - ${locale.toUpperCase()}`,
        html,
      });

      if (error) {
        logger.error({ error: error.message }, "Email send failed");
        results.push({ template: "MemberWelcome", locale, success: false });
      } else {
        logger.info({ id: data?.id }, "Email sent");
        results.push({
          template: "MemberWelcome",
          locale,
          success: true,
          id: data?.id,
        });
      }
    } catch (err) {
      logger.error({ err }, "Email send exception");
      results.push({ template: "MemberWelcome", locale, success: false });
    }
  }

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info(
    { succeeded, failed, total: 6, email: TEST_EMAIL },
    "Test emails completed"
  );
}

sendTestEmails()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Fatal error");
    process.exit(1);
  });
