import { render } from "@react-email/render";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

// Import templates - using default exports
import LeadConfirmation from "../emails/templates/LeadConfirmation";
import SalesRepAssignment from "../emails/templates/SalesRepAssignment";
import LeadFollowup from "../emails/templates/LeadFollowup";
import MemberWelcome from "../emails/templates/MemberWelcome";
import MemberPasswordReset from "../emails/templates/MemberPasswordReset";
import VehicleInspectionReminder from "../emails/templates/VehicleInspectionReminder";
import InsuranceExpiryAlert from "../emails/templates/InsuranceExpiryAlert";
import DriverOnboarding from "../emails/templates/DriverOnboarding";
import MaintenanceScheduled from "../emails/templates/MaintenanceScheduled";
import CriticalAlert from "../emails/templates/CriticalAlert";
import WebhookTest from "../emails/templates/WebhookTest";

/**
 * Generate HTML and Plain Text Email Templates
 *
 * This script generates production-ready HTML and plain text versions
 * of email templates for seeding into the database.
 *
 * Process:
 * 1. Render React Email components with placeholder variables
 * 2. Generate both HTML and plain text versions
 * 3. Save to generated-emails/ folder for inspection
 * 4. Output files ready to copy into prisma/seed.ts
 *
 * Usage:
 * ```bash
 * pnpm exec tsx scripts/generate-email-templates.ts
 * ```
 *
 * Output: 11 templates (22 files: HTML + TXT)
 * - lead-confirmation (CRM)
 * - sales-rep-assignment (CRM)
 * - lead-followup (CRM)
 * - member-welcome (ADM)
 * - member-password-reset (ADM)
 * - vehicle-inspection-reminder (FLEET)
 * - insurance-expiry-alert (FLEET)
 * - driver-onboarding (DRIVER)
 * - maintenance-scheduled (MAINTENANCE)
 * - critical-alert (SYSTEM)
 * - webhook-test (SYSTEM)
 */

async function generateTemplates() {
  logger.info("🎨 Generating email templates from React components...\n");

  // Output directory
  const outputDir = path.join(process.cwd(), "generated-emails");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Template 1: Lead Confirmation
  logger.info("1️⃣  Generating lead_confirmation template...");

  const leadConfirmationHTML = await render(
    LeadConfirmation({
      first_name: "{{first_name}}",
      company_name: "{{company_name}}",
      fleet_size: "{{fleet_size}}",
      country_name: "{{country_name}}",
    })
  );

  const leadConfirmationText = await render(
    LeadConfirmation({
      first_name: "{{first_name}}",
      company_name: "{{company_name}}",
      fleet_size: "{{fleet_size}}",
      country_name: "{{country_name}}",
    }),
    { plainText: true }
  );

  // Replace static logo path with production URL for lead confirmation
  const leadConfirmationHTMLFinal = leadConfirmationHTML.replace(
    /\/static\/fleetcore-logo\.jpg/g,
    "https://app.fleetcore.com/fleetcore-logo.jpg"
  );

  fs.writeFileSync(
    path.join(outputDir, "lead-confirmation.html"),
    leadConfirmationHTMLFinal
  );
  fs.writeFileSync(
    path.join(outputDir, "lead-confirmation.txt"),
    leadConfirmationText
  );

  logger.info("   ✅ lead-confirmation.html");
  logger.info("   ✅ lead-confirmation.txt\n");

  // Template 2: Sales Rep Assignment
  logger.info("2️⃣  Generating sales_rep_assignment template...");

  const salesRepAssignmentHTML = await render(
    SalesRepAssignment({
      employee_name: "{{employee_name}}",
      lead_name: "{{lead_name}}",
      company_name: "{{company_name}}",
      priority: "high",
      fit_score: 0,
      qualification_score: 0,
      lead_stage: "{{lead_stage}}",
      fleet_size: "{{fleet_size}}",
      country_code: "{{country_code}}",
      lead_detail_url: "{{lead_detail_url}}",
    })
  );

  const salesRepAssignmentText = await render(
    SalesRepAssignment({
      employee_name: "{{employee_name}}",
      lead_name: "{{lead_name}}",
      company_name: "{{company_name}}",
      priority: "high",
      fit_score: 0,
      qualification_score: 0,
      lead_stage: "{{lead_stage}}",
      fleet_size: "{{fleet_size}}",
      country_code: "{{country_code}}",
      lead_detail_url: "{{lead_detail_url}}",
    }),
    { plainText: true }
  );

  // Replace numeric values with template variables in HTML
  const salesRepAssignmentHTMLFinal = salesRepAssignmentHTML
    .replace(/HIGH<!-- -->/g, "{{priority}}")
    .replace(/0<!-- -->\/60/g, "{{fit_score}}/60")
    .replace(/0<!-- -->\/100/g, "{{qualification_score}}/100");

  // Replace numeric values with template variables in plain text
  const salesRepAssignmentTextFinal = salesRepAssignmentText
    .replace(/HIGH/g, "{{PRIORITY}}")
    .replace(/high/g, "{{priority}}")
    .replace(/0\/60/g, "{{fit_score}}/60")
    .replace(/0\/100/g, "{{qualification_score}}/100");

  fs.writeFileSync(
    path.join(outputDir, "sales-rep-assignment.html"),
    salesRepAssignmentHTMLFinal
  );
  fs.writeFileSync(
    path.join(outputDir, "sales-rep-assignment.txt"),
    salesRepAssignmentTextFinal
  );

  logger.info("   ✅ sales-rep-assignment.html");
  logger.info("   ✅ sales-rep-assignment.txt\n");

  // Template 3: Lead Followup
  logger.info("3️⃣  Generating lead_followup template...");

  const leadFollowupHTML = await render(
    LeadFollowup({
      first_name: "{{first_name}}",
      company_name: "{{company_name}}",
      demo_link: "{{demo_link}}",
      sales_rep_name: "{{sales_rep_name}}",
    })
  );

  const leadFollowupText = await render(
    LeadFollowup({
      first_name: "{{first_name}}",
      company_name: "{{company_name}}",
      demo_link: "{{demo_link}}",
      sales_rep_name: "{{sales_rep_name}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "lead-followup.html"),
    leadFollowupHTML
  );
  fs.writeFileSync(path.join(outputDir, "lead-followup.txt"), leadFollowupText);

  logger.info("   ✅ lead-followup.html");
  logger.info("   ✅ lead-followup.txt\n");

  // Template 4: Member Welcome
  logger.info("4️⃣  Generating member_welcome template...");

  const memberWelcomeHTML = await render(
    MemberWelcome({
      first_name: "{{first_name}}",
      tenant_name: "{{tenant_name}}",
      email: "{{email}}",
      role: "{{role}}",
      dashboard_url: "{{dashboard_url}}",
    })
  );

  const memberWelcomeText = await render(
    MemberWelcome({
      first_name: "{{first_name}}",
      tenant_name: "{{tenant_name}}",
      email: "{{email}}",
      role: "{{role}}",
      dashboard_url: "{{dashboard_url}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "member-welcome.html"),
    memberWelcomeHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "member-welcome.txt"),
    memberWelcomeText
  );

  logger.info("   ✅ member-welcome.html");
  logger.info("   ✅ member-welcome.txt\n");

  // Template 5: Member Password Reset
  logger.info("5️⃣  Generating member_password_reset template...");

  const memberPasswordResetHTML = await render(
    MemberPasswordReset({
      first_name: "{{first_name}}",
      reset_link: "{{reset_link}}",
      expiry_hours: "{{expiry_hours}}",
    })
  );

  const memberPasswordResetText = await render(
    MemberPasswordReset({
      first_name: "{{first_name}}",
      reset_link: "{{reset_link}}",
      expiry_hours: "{{expiry_hours}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "member-password-reset.html"),
    memberPasswordResetHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "member-password-reset.txt"),
    memberPasswordResetText
  );

  logger.info("   ✅ member-password-reset.html");
  logger.info("   ✅ member-password-reset.txt\n");

  // Template 6: Vehicle Inspection Reminder
  logger.info("6️⃣  Generating vehicle_inspection_reminder template...");

  const vehicleInspectionReminderHTML = await render(
    VehicleInspectionReminder({
      fleet_manager_name: "{{fleet_manager_name}}",
      vehicle_make: "{{vehicle_make}}",
      vehicle_model: "{{vehicle_model}}",
      vehicle_plate: "{{vehicle_plate}}",
      due_date: "{{due_date}}",
      days_remaining: "{{days_remaining}}",
      booking_link: "{{booking_link}}",
    })
  );

  const vehicleInspectionReminderText = await render(
    VehicleInspectionReminder({
      fleet_manager_name: "{{fleet_manager_name}}",
      vehicle_make: "{{vehicle_make}}",
      vehicle_model: "{{vehicle_model}}",
      vehicle_plate: "{{vehicle_plate}}",
      due_date: "{{due_date}}",
      days_remaining: "{{days_remaining}}",
      booking_link: "{{booking_link}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "vehicle-inspection-reminder.html"),
    vehicleInspectionReminderHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "vehicle-inspection-reminder.txt"),
    vehicleInspectionReminderText
  );

  logger.info("   ✅ vehicle-inspection-reminder.html");
  logger.info("   ✅ vehicle-inspection-reminder.txt\n");

  // Template 7: Insurance Expiry Alert
  logger.info("7️⃣  Generating insurance_expiry_alert template...");

  const insuranceExpiryAlertHTML = await render(
    InsuranceExpiryAlert({
      fleet_manager_name: "{{fleet_manager_name}}",
      vehicle_make: "{{vehicle_make}}",
      vehicle_model: "{{vehicle_model}}",
      vehicle_plate: "{{vehicle_plate}}",
      expiry_date: "{{expiry_date}}",
      days_remaining: "{{days_remaining}}",
      insurance_provider: "{{insurance_provider}}",
      policy_number: "{{policy_number}}",
      insurance_details_url: "{{insurance_details_url}}",
    })
  );

  const insuranceExpiryAlertText = await render(
    InsuranceExpiryAlert({
      fleet_manager_name: "{{fleet_manager_name}}",
      vehicle_make: "{{vehicle_make}}",
      vehicle_model: "{{vehicle_model}}",
      vehicle_plate: "{{vehicle_plate}}",
      expiry_date: "{{expiry_date}}",
      days_remaining: "{{days_remaining}}",
      insurance_provider: "{{insurance_provider}}",
      policy_number: "{{policy_number}}",
      insurance_details_url: "{{insurance_details_url}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "insurance-expiry-alert.html"),
    insuranceExpiryAlertHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "insurance-expiry-alert.txt"),
    insuranceExpiryAlertText
  );

  logger.info("   ✅ insurance-expiry-alert.html");
  logger.info("   ✅ insurance-expiry-alert.txt\n");

  // Template 8: Driver Onboarding
  logger.info("8️⃣  Generating driver_onboarding template...");

  const driverOnboardingHTML = await render(
    DriverOnboarding({
      driver_name: "{{driver_name}}",
      fleet_name: "{{fleet_name}}",
      driver_id: "{{driver_id}}",
      start_date: "{{start_date}}",
      fleet_manager_name: "{{fleet_manager_name}}",
      driver_portal_url: "{{driver_portal_url}}",
    })
  );

  const driverOnboardingText = await render(
    DriverOnboarding({
      driver_name: "{{driver_name}}",
      fleet_name: "{{fleet_name}}",
      driver_id: "{{driver_id}}",
      start_date: "{{start_date}}",
      fleet_manager_name: "{{fleet_manager_name}}",
      driver_portal_url: "{{driver_portal_url}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "driver-onboarding.html"),
    driverOnboardingHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "driver-onboarding.txt"),
    driverOnboardingText
  );

  logger.info("   ✅ driver-onboarding.html");
  logger.info("   ✅ driver-onboarding.txt\n");

  // Template 9: Maintenance Scheduled
  logger.info("9️⃣  Generating maintenance_scheduled template...");

  const maintenanceScheduledHTML = await render(
    MaintenanceScheduled({
      driver_name: "{{driver_name}}",
      vehicle_make: "{{vehicle_make}}",
      vehicle_model: "{{vehicle_model}}",
      vehicle_plate: "{{vehicle_plate}}",
      maintenance_date: "{{maintenance_date}}",
      maintenance_time: "{{maintenance_time}}",
      maintenance_location: "{{maintenance_location}}",
      maintenance_type: "{{maintenance_type}}",
      estimated_duration: "{{estimated_duration}}",
      maintenance_details_url: "{{maintenance_details_url}}",
    })
  );

  const maintenanceScheduledText = await render(
    MaintenanceScheduled({
      driver_name: "{{driver_name}}",
      vehicle_make: "{{vehicle_make}}",
      vehicle_model: "{{vehicle_model}}",
      vehicle_plate: "{{vehicle_plate}}",
      maintenance_date: "{{maintenance_date}}",
      maintenance_time: "{{maintenance_time}}",
      maintenance_location: "{{maintenance_location}}",
      maintenance_type: "{{maintenance_type}}",
      estimated_duration: "{{estimated_duration}}",
      maintenance_details_url: "{{maintenance_details_url}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "maintenance-scheduled.html"),
    maintenanceScheduledHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "maintenance-scheduled.txt"),
    maintenanceScheduledText
  );

  logger.info("   ✅ maintenance-scheduled.html");
  logger.info("   ✅ maintenance-scheduled.txt\n");

  // Template 10: Critical Alert
  logger.info("🔟 Generating critical_alert template...");

  const criticalAlertHTML = await render(
    CriticalAlert({
      alert_title: "{{alert_title}}",
      alert_time: "{{alert_time}}",
      severity: "{{severity}}",
      affected_items: "{{affected_items}}",
      alert_description: "{{alert_description}}",
      recommended_action: "{{recommended_action}}",
      alert_url: "{{alert_url}}",
    })
  );

  const criticalAlertText = await render(
    CriticalAlert({
      alert_title: "{{alert_title}}",
      alert_time: "{{alert_time}}",
      severity: "{{severity}}",
      affected_items: "{{affected_items}}",
      alert_description: "{{alert_description}}",
      recommended_action: "{{recommended_action}}",
      alert_url: "{{alert_url}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(
    path.join(outputDir, "critical-alert.html"),
    criticalAlertHTML
  );
  fs.writeFileSync(
    path.join(outputDir, "critical-alert.txt"),
    criticalAlertText
  );

  logger.info("   ✅ critical-alert.html");
  logger.info("   ✅ critical-alert.txt\n");

  // Template 11: Webhook Test
  logger.info("1️⃣1️⃣ Generating webhook_test template...");

  const webhookTestHTML = await render(
    WebhookTest({
      timestamp: "{{timestamp}}",
      test_id: "{{test_id}}",
    })
  );

  const webhookTestText = await render(
    WebhookTest({
      timestamp: "{{timestamp}}",
      test_id: "{{test_id}}",
    }),
    { plainText: true }
  );

  fs.writeFileSync(path.join(outputDir, "webhook-test.html"), webhookTestHTML);
  fs.writeFileSync(path.join(outputDir, "webhook-test.txt"), webhookTestText);

  logger.info("   ✅ webhook-test.html");
  logger.info("   ✅ webhook-test.txt\n");

  // Summary
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info("✅ GENERATION COMPLETE");
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  logger.info(`📁 Output directory: ${outputDir}\n`);

  logger.info("📄 Generated files:");
  const files = fs.readdirSync(outputDir);
  files.forEach((file) => {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2);
    logger.info(`   - ${file} (${size} KB)`);
  });

  logger.info("\n🔍 Verify variables:");
  logger.info("   Check that {{variable}} placeholders are present in HTML");
  logger.info(
    '   grep "{{first_name}}" generated-emails/lead-confirmation.html\n'
  );

  logger.info("📋 Next steps:");
  logger.info("   1. Review generated HTML files");
  logger.info("   2. Copy HTML content to prisma/seed.ts");
  logger.info("   3. Run: pnpm prisma:seed");
  logger.info("   4. Test: pnpm exec tsx scripts/test-email-send.ts\n");

  return {
    leadConfirmation: {
      html: leadConfirmationHTMLFinal,
      text: leadConfirmationText,
    },
    salesRepAssignment: {
      html: salesRepAssignmentHTMLFinal,
      text: salesRepAssignmentTextFinal,
    },
    leadFollowup: {
      html: leadFollowupHTML,
      text: leadFollowupText,
    },
    memberWelcome: {
      html: memberWelcomeHTML,
      text: memberWelcomeText,
    },
    memberPasswordReset: {
      html: memberPasswordResetHTML,
      text: memberPasswordResetText,
    },
    vehicleInspectionReminder: {
      html: vehicleInspectionReminderHTML,
      text: vehicleInspectionReminderText,
    },
    insuranceExpiryAlert: {
      html: insuranceExpiryAlertHTML,
      text: insuranceExpiryAlertText,
    },
    driverOnboarding: {
      html: driverOnboardingHTML,
      text: driverOnboardingText,
    },
    maintenanceScheduled: {
      html: maintenanceScheduledHTML,
      text: maintenanceScheduledText,
    },
    criticalAlert: {
      html: criticalAlertHTML,
      text: criticalAlertText,
    },
    webhookTest: {
      html: webhookTestHTML,
      text: webhookTestText,
    },
  };
}

// Execute
generateTemplates()
  .then(() => {
    logger.info("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error details:", error);
    logger.error(
      { error: error.message, stack: error.stack },
      "❌ Script failed"
    );
    process.exit(1);
  });
