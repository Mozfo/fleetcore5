import { writeFileSync } from "fs";
import { render } from "@react-email/components";
import { logger } from "@/lib/logger";
import type { ReactElement } from "react";

// Import all templates
import { LeadConfirmation } from "@/emails/templates/LeadConfirmation";
import { LeadConfirmationFR } from "@/emails/templates/LeadConfirmationFR";
import { LeadConfirmationAR } from "@/emails/templates/LeadConfirmationAR";

import { LeadFollowup } from "@/emails/templates/LeadFollowup";
import { LeadFollowupFR } from "@/emails/templates/LeadFollowupFR";
import { LeadFollowupAR } from "@/emails/templates/LeadFollowupAR";

import { MemberWelcome } from "@/emails/templates/MemberWelcome";
import { MemberWelcomeFR } from "@/emails/templates/MemberWelcomeFR";
import { MemberWelcomeAR } from "@/emails/templates/MemberWelcomeAR";

import { MemberPasswordReset } from "@/emails/templates/MemberPasswordReset";
import { MemberPasswordResetFR } from "@/emails/templates/MemberPasswordResetFR";
import { MemberPasswordResetAR } from "@/emails/templates/MemberPasswordResetAR";

import { SalesRepAssignment } from "@/emails/templates/SalesRepAssignment";
import { SalesRepAssignmentFR } from "@/emails/templates/SalesRepAssignmentFR";
import { SalesRepAssignmentAR } from "@/emails/templates/SalesRepAssignmentAR";

import { VehicleInspectionReminder } from "@/emails/templates/VehicleInspectionReminder";
import { VehicleInspectionReminderFR } from "@/emails/templates/VehicleInspectionReminderFR";
import { VehicleInspectionReminderAR } from "@/emails/templates/VehicleInspectionReminderAR";

import { DriverOnboarding } from "@/emails/templates/DriverOnboarding";
import { DriverOnboardingFR } from "@/emails/templates/DriverOnboardingFR";
import { DriverOnboardingAR } from "@/emails/templates/DriverOnboardingAR";

import { InsuranceExpiryAlert } from "@/emails/templates/InsuranceExpiryAlert";
import { InsuranceExpiryAlertFR } from "@/emails/templates/InsuranceExpiryAlertFR";
import { InsuranceExpiryAlertAR } from "@/emails/templates/InsuranceExpiryAlertAR";

import { MaintenanceScheduled } from "@/emails/templates/MaintenanceScheduled";
import { MaintenanceScheduledFR } from "@/emails/templates/MaintenanceScheduledFR";
import { MaintenanceScheduledAR } from "@/emails/templates/MaintenanceScheduledAR";

import { CriticalAlert } from "@/emails/templates/CriticalAlert";
import { CriticalAlertFR } from "@/emails/templates/CriticalAlertFR";
import { CriticalAlertAR } from "@/emails/templates/CriticalAlertAR";

import { WebhookTest } from "@/emails/templates/WebhookTest";
import { WebhookTestFR } from "@/emails/templates/WebhookTestFR";
import { WebhookTestAR } from "@/emails/templates/WebhookTestAR";

import { ExpansionOpportunity } from "@/emails/templates/ExpansionOpportunity";
import { ExpansionOpportunityFR } from "@/emails/templates/ExpansionOpportunityFR";
import { ExpansionOpportunityAR } from "@/emails/templates/ExpansionOpportunityAR";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentFunction = (props: any) => ReactElement;

interface TemplateConfig {
  code: string;
  components: Record<string, ComponentFunction>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
}

/**
 * Régénère tous les templates avec {{placeholders}}
 */
async function regenerateAllTemplates(): Promise<void> {
  try {
    logger.info(
      "🔄 RÉGÉNÉRATION DE TOUS LES TEMPLATES AVEC {{placeholders}}\n"
    );

    const templates: TemplateConfig[] = [
      {
        code: "lead_confirmation",
        components: {
          en: LeadConfirmation,
          fr: LeadConfirmationFR,
          ar: LeadConfirmationAR,
        },
        props: {
          first_name: "{{first_name}}",
          company_name: "{{company_name}}",
          fleet_size: "{{fleet_size}}",
          country_preposition: "{{country_preposition}}",
          country_name: "{{country_name}}",
          phone_row: "{{phone_row}}",
          message_row: "{{message_row}}",
        },
      },
      {
        code: "expansion_opportunity",
        components: {
          en: ExpansionOpportunity,
          fr: ExpansionOpportunityFR,
          ar: ExpansionOpportunityAR,
        },
        props: {
          first_name: "{{first_name}}",
          company_name: "{{company_name}}",
          fleet_size: "{{fleet_size}}",
          country_preposition: "{{country_preposition}}",
          country_name: "{{country_name}}",
          phone_row: "{{phone_row}}",
          message_row: "{{message_row}}",
        },
      },
      {
        code: "lead_followup",
        components: {
          en: LeadFollowup,
          fr: LeadFollowupFR,
          ar: LeadFollowupAR,
        },
        props: {
          first_name: "{{first_name}}",
          company_name: "{{company_name}}",
          demo_link: "{{demo_link}}",
          sales_rep_name: "{{sales_rep_name}}",
        },
      },
      {
        code: "member_welcome",
        components: {
          en: MemberWelcome,
          fr: MemberWelcomeFR,
          ar: MemberWelcomeAR,
        },
        props: {
          first_name: "{{first_name}}",
          tenant_name: "{{tenant_name}}",
          email: "{{email}}",
          role: "{{role}}",
          dashboard_url: "{{dashboard_url}}",
        },
      },
      {
        code: "member_password_reset",
        components: {
          en: MemberPasswordReset,
          fr: MemberPasswordResetFR,
          ar: MemberPasswordResetAR,
        },
        props: {
          first_name: "{{first_name}}",
          reset_link: "{{reset_link}}",
          expiry_hours: "{{expiry_hours}}",
        },
      },
      {
        code: "sales_rep_assignment",
        components: {
          en: SalesRepAssignment,
          fr: SalesRepAssignmentFR,
          ar: SalesRepAssignmentAR,
        },
        props: {
          employee_name: "{{employee_name}}",
          lead_name: "{{lead_name}}",
          company_name: "{{company_name}}",
          priority: "high",
          fit_score: "{{fit_score}}",
          qualification_score: "{{qualification_score}}",
          lead_stage: "{{lead_stage}}",
          fleet_size: "{{fleet_size}}",
          country_code: "{{country_code}}",
          lead_detail_url: "{{lead_detail_url}}",
        },
      },
      {
        code: "vehicle_inspection_reminder",
        components: {
          en: VehicleInspectionReminder,
          fr: VehicleInspectionReminderFR,
          ar: VehicleInspectionReminderAR,
        },
        props: {
          fleet_manager_name: "{{fleet_manager_name}}",
          vehicle_make: "{{vehicle_make}}",
          vehicle_model: "{{vehicle_model}}",
          vehicle_plate: "{{vehicle_plate}}",
          due_date: "{{due_date}}",
          days_remaining: "{{days_remaining}}",
          booking_link: "{{booking_link}}",
        },
      },
      {
        code: "driver_onboarding",
        components: {
          en: DriverOnboarding,
          fr: DriverOnboardingFR,
          ar: DriverOnboardingAR,
        },
        props: {
          driver_name: "{{driver_name}}",
          fleet_name: "{{fleet_name}}",
          driver_id: "{{driver_id}}",
          start_date: "{{start_date}}",
          fleet_manager_name: "{{fleet_manager_name}}",
          driver_portal_url: "{{driver_portal_url}}",
        },
      },
      {
        code: "insurance_expiry_alert",
        components: {
          en: InsuranceExpiryAlert,
          fr: InsuranceExpiryAlertFR,
          ar: InsuranceExpiryAlertAR,
        },
        props: {
          fleet_manager_name: "{{fleet_manager_name}}",
          vehicle_make: "{{vehicle_make}}",
          vehicle_model: "{{vehicle_model}}",
          vehicle_plate: "{{vehicle_plate}}",
          expiry_date: "{{expiry_date}}",
          days_remaining: "{{days_remaining}}",
          insurance_provider: "{{insurance_provider}}",
          policy_number: "{{policy_number}}",
          insurance_details_url: "{{insurance_details_url}}",
        },
      },
      {
        code: "maintenance_scheduled",
        components: {
          en: MaintenanceScheduled,
          fr: MaintenanceScheduledFR,
          ar: MaintenanceScheduledAR,
        },
        props: {
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
        },
      },
      {
        code: "critical_alert",
        components: {
          en: CriticalAlert,
          fr: CriticalAlertFR,
          ar: CriticalAlertAR,
        },
        props: {
          alert_title: "{{alert_title}}",
          alert_time: "{{alert_time}}",
          severity: "{{severity}}",
          affected_items: "{{affected_items}}",
          alert_description: "{{alert_description}}",
          recommended_action: "{{recommended_action}}",
          alert_url: "{{alert_url}}",
        },
      },
      {
        code: "webhook_test",
        components: { en: WebhookTest, fr: WebhookTestFR, ar: WebhookTestAR },
        props: {
          timestamp: "{{timestamp}}",
          test_id: "{{test_id}}",
        },
      },
    ];

    const htmlOutputs: Record<string, Record<string, string>> = {};

    for (const template of templates) {
      logger.info(`📝 Régénération ${template.code}...`);
      htmlOutputs[template.code] = {};

      for (const [locale, Component] of Object.entries(template.components)) {
        let html = await render(Component(template.props));

        // Post-processing: replace temporary values with placeholders
        if (template.code === "sales_rep_assignment") {
          html = html.replace(/high/g, "{{priority}}");
          html = html.replace(/haute/g, "{{priority}}");
          html = html.replace(/عالية/g, "{{priority}}");
        }

        htmlOutputs[template.code][locale] = html;
        logger.info(`   ✅ [${locale}] ${html.length} caractères`);
      }
    }

    // Save to JSON for manual update of seed.ts
    const outputPath = "generated-emails/regenerated-templates.json";
    writeFileSync(outputPath, JSON.stringify(htmlOutputs, null, 2), "utf-8");

    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ RÉGÉNÉRATION TERMINÉE");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(`Fichier généré: ${outputPath}`);
    logger.info("12 templates × 3 langues = 36 HTMLs régénérés");
    logger.info("\n💡 Maintenant: mettre à jour seed.ts avec ces HTMLs");
  } catch (error) {
    logger.error({ error }, "Erreur régénération");
    throw error;
  }
}

regenerateAllTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
