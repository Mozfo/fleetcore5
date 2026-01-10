import { config } from "dotenv";
config({ path: ".env.local" });

import { render } from "@react-email/render";
import { Resend } from "resend";
import { DemoReminderJ1 } from "@/emails/templates/DemoReminderJ1";

async function sendTestEmail() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("RESEND_API_KEY not configured");
    process.exit(1);
  }

  const resend = new Resend(resendApiKey);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fleetcore.io";

  // Test data
  const locale = "fr";
  const bookingTime = "14:30";
  const bookingDate = "Samedi 11 janvier 2026";
  const timezone = "GMT+1";

  const html = await render(
    DemoReminderJ1({
      locale,
      firstName: "Mohamed",
      companyName: "Bluewise",
      bookingDate,
      bookingTime,
      timezone,
      phone: "+33 6 12 34 56 78",
      fleetSize: "6-10 véhicules",
      confirmUrl: `${baseUrl}/api/crm/leads/confirm-attendance?token=test-token-123`,
      rescheduleUrl: `${baseUrl}/book-demo/reschedule?uid=test-uid-456`,
    })
  );

  const subject = `Demain à ${bookingTime} - Merci de confirmer votre démo FleetCore`;

  console.log("Sending email to mohamed@bluewise.io...");

  const { data, error } = await resend.emails.send({
    from: "FleetCore <demos@fleetcore.io>",
    to: "mohamed@bluewise.io",
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send:", error);
    process.exit(1);
  }

  console.log("Email sent successfully!", data);
}

void sendTestEmail();
