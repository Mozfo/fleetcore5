import { writeFileSync } from "fs";
import { render } from "@react-email/components";
import { logger } from "@/lib/logger";
import type { EmailLocale } from "@/lib/i18n/email-translations";

// Import all templates
import { LeadConfirmation } from "@/emails/templates/LeadConfirmation";
import { LeadFollowup } from "@/emails/templates/LeadFollowup";
import { MemberWelcome } from "@/emails/templates/MemberWelcome";
import { MemberPasswordReset } from "@/emails/templates/MemberPasswordReset";
import { SalesRepAssignment } from "@/emails/templates/SalesRepAssignment";
import { VehicleInspectionReminder } from "@/emails/templates/VehicleInspectionReminder";
import { DriverOnboarding } from "@/emails/templates/DriverOnboarding";
import { InsuranceExpiryAlert } from "@/emails/templates/InsuranceExpiryAlert";
import { MaintenanceScheduled } from "@/emails/templates/MaintenanceScheduled";
import { CriticalAlert } from "@/emails/templates/CriticalAlert";
import { WebhookTest } from "@/emails/templates/WebhookTest";
import { ExpansionOpportunity } from "@/emails/templates/ExpansionOpportunity";

// ============================================================================
// TYPE-SAFE TEMPLATE DEFINITIONS
// ============================================================================

interface LeadConfirmationProps {
  locale?: EmailLocale;
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_preposition: string;
  country_name: string;
  phone_row: string;
  message_row: string;
}

interface ExpansionOpportunityProps {
  locale?: EmailLocale;
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_preposition: string;
  country_name: string;
  phone_row: string;
  message_row: string;
}

interface LeadFollowupProps {
  locale?: EmailLocale;
  first_name: string;
  company_name: string;
  demo_link: string;
  sales_rep_name: string;
}

interface MemberWelcomeProps {
  locale?: EmailLocale;
  first_name: string;
  tenant_name: string;
  email: string;
  role: string;
  dashboard_url: string;
}

interface MemberPasswordResetProps {
  locale?: EmailLocale;
  first_name: string;
  reset_link: string;
  expiry_hours: string;
}

interface SalesRepAssignmentProps {
  locale?: EmailLocale;
  employee_name: string;
  lead_name: string;
  company_name: string;
  priority: "urgent" | "high" | "medium" | "low";
  fit_score: number;
  qualification_score: number;
  lead_stage: string;
  fleet_size: string;
  country_code: string;
  lead_detail_url: string;
}

interface VehicleInspectionReminderProps {
  locale?: EmailLocale;
  fleet_manager_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  due_date: string;
  days_remaining: string;
  booking_link: string;
}

interface DriverOnboardingProps {
  locale?: EmailLocale;
  driver_name: string;
  fleet_name: string;
  driver_id: string;
  start_date: string;
  fleet_manager_name: string;
  driver_portal_url: string;
}

interface InsuranceExpiryAlertProps {
  locale?: EmailLocale;
  fleet_manager_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  expiry_date: string;
  days_remaining: string;
  insurance_provider: string;
  policy_number: string;
  insurance_details_url: string;
}

interface MaintenanceScheduledProps {
  locale?: EmailLocale;
  driver_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  maintenance_date: string;
  maintenance_time: string;
  maintenance_location: string;
  maintenance_type: string;
  estimated_duration: string;
  maintenance_details_url: string;
}

interface CriticalAlertProps {
  locale?: EmailLocale;
  alert_title: string;
  alert_time: string;
  severity: string;
  affected_items: string;
  alert_description: string;
  recommended_action: string;
  alert_url: string;
}

interface WebhookTestProps {
  locale?: EmailLocale;
  timestamp: string;
  test_id: string;
}

// Discriminated Union - Type-safe template configuration
type TemplateConfig =
  | { code: "lead_confirmation"; props: Omit<LeadConfirmationProps, "locale"> }
  | {
      code: "expansion_opportunity";
      props: Omit<ExpansionOpportunityProps, "locale">;
    }
  | { code: "lead_followup"; props: Omit<LeadFollowupProps, "locale"> }
  | { code: "member_welcome"; props: Omit<MemberWelcomeProps, "locale"> }
  | {
      code: "member_password_reset";
      props: Omit<MemberPasswordResetProps, "locale">;
    }
  | {
      code: "sales_rep_assignment";
      props: Omit<SalesRepAssignmentProps, "locale">;
    }
  | {
      code: "vehicle_inspection_reminder";
      props: Omit<VehicleInspectionReminderProps, "locale">;
    }
  | { code: "driver_onboarding"; props: Omit<DriverOnboardingProps, "locale"> }
  | {
      code: "insurance_expiry_alert";
      props: Omit<InsuranceExpiryAlertProps, "locale">;
    }
  | {
      code: "maintenance_scheduled";
      props: Omit<MaintenanceScheduledProps, "locale">;
    }
  | { code: "critical_alert"; props: Omit<CriticalAlertProps, "locale"> }
  | { code: "webhook_test"; props: Omit<WebhookTestProps, "locale"> };

// ============================================================================
// TYPE-SAFE RENDER FUNCTION
// ============================================================================

async function renderTemplate(
  config: TemplateConfig,
  locale: EmailLocale
): Promise<string> {
  switch (config.code) {
    case "lead_confirmation":
      return render(LeadConfirmation({ ...config.props, locale }));
    case "expansion_opportunity":
      return render(ExpansionOpportunity({ ...config.props, locale }));
    case "lead_followup":
      return render(LeadFollowup({ ...config.props, locale }));
    case "member_welcome":
      return render(MemberWelcome({ ...config.props, locale }));
    case "member_password_reset":
      return render(MemberPasswordReset({ ...config.props, locale }));
    case "sales_rep_assignment":
      return render(SalesRepAssignment({ ...config.props, locale }));
    case "vehicle_inspection_reminder":
      return render(VehicleInspectionReminder({ ...config.props, locale }));
    case "driver_onboarding":
      return render(DriverOnboarding({ ...config.props, locale }));
    case "insurance_expiry_alert":
      return render(InsuranceExpiryAlert({ ...config.props, locale }));
    case "maintenance_scheduled":
      return render(MaintenanceScheduled({ ...config.props, locale }));
    case "critical_alert":
      return render(CriticalAlert({ ...config.props, locale }));
    case "webhook_test":
      return render(WebhookTest({ ...config.props, locale }));
  }
}

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

const LOCALES: EmailLocale[] = ["en", "fr", "ar"];

const templates: TemplateConfig[] = [
  {
    code: "lead_confirmation",
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
    props: {
      first_name: "{{first_name}}",
      company_name: "{{company_name}}",
      demo_link: "{{demo_link}}",
      sales_rep_name: "{{sales_rep_name}}",
    },
  },
  {
    code: "member_welcome",
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
    props: {
      first_name: "{{first_name}}",
      reset_link: "{{reset_link}}",
      expiry_hours: "{{expiry_hours}}",
    },
  },
  {
    code: "sales_rep_assignment",
    props: {
      employee_name: "{{employee_name}}",
      lead_name: "{{lead_name}}",
      company_name: "{{company_name}}",
      priority: "high",
      fit_score: 85, // Placeholder: replaced in post-processing
      qualification_score: 90, // Placeholder: replaced in post-processing
      lead_stage: "{{lead_stage}}",
      fleet_size: "{{fleet_size}}",
      country_code: "{{country_code}}",
      lead_detail_url: "{{lead_detail_url}}",
    },
  },
  {
    code: "vehicle_inspection_reminder",
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
    props: {
      timestamp: "{{timestamp}}",
      test_id: "{{test_id}}",
    },
  },
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function regenerateAllTemplates(): Promise<void> {
  logger.info("REGENERATION DE TOUS LES TEMPLATES AVEC {{placeholders}}\n");

  const htmlOutputs: Record<string, Record<string, string>> = {};

  for (const template of templates) {
    logger.info(`Regeneration ${template.code}...`);
    htmlOutputs[template.code] = {};

    for (const locale of LOCALES) {
      let html = await renderTemplate(template, locale);

      // Post-processing: replace temporary values with placeholders
      if (template.code === "sales_rep_assignment") {
        html = html.replace(/high/g, "{{priority}}");
        html = html.replace(/haute/g, "{{priority}}");
        html = html.replace(/عالية/g, "{{priority}}");
        html = html.replace(/85/g, "{{fit_score}}");
        html = html.replace(/90/g, "{{qualification_score}}");
      }

      htmlOutputs[template.code][locale] = html;
      logger.info(`   [${locale}] ${html.length} caracteres`);
    }
  }

  // Save to JSON for manual update of seed.ts
  const outputPath = "generated-emails/regenerated-templates.json";
  writeFileSync(outputPath, JSON.stringify(htmlOutputs, null, 2), "utf-8");

  logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info("REGENERATION TERMINEE");
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info(`Fichier genere: ${outputPath}`);
  logger.info("12 templates x 3 langues = 36 HTMLs regeneres");
  logger.info("\nMaintenant: mettre a jour seed.ts avec ces HTMLs");
}

regenerateAllTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ error }, "Erreur regeneration");
    process.exit(1);
  });
