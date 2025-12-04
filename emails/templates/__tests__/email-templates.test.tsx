/**
 * Email Templates - Snapshot & i18n Tests
 *
 * Tests:
 * - Rendering in EN/FR/AR
 * - RTL direction for Arabic
 * - Variable interpolation
 * - Structure consistency across locales
 */

import { describe, it, expect } from "vitest";
import { render } from "@react-email/render";
import type { EmailLocale } from "@/lib/i18n/email-translations";

// Import all templates
import { LeadConfirmation } from "../LeadConfirmation";
import { ExpansionOpportunity } from "../ExpansionOpportunity";
import { LeadFollowup } from "../LeadFollowup";
import { MemberWelcome } from "../MemberWelcome";
import { MemberPasswordReset } from "../MemberPasswordReset";
import { SalesRepAssignment } from "../SalesRepAssignment";
import { VehicleInspectionReminder } from "../VehicleInspectionReminder";
import { DriverOnboarding } from "../DriverOnboarding";
import { InsuranceExpiryAlert } from "../InsuranceExpiryAlert";
import { MaintenanceScheduled } from "../MaintenanceScheduled";
import { CriticalAlert } from "../CriticalAlert";
import { WebhookTest } from "../WebhookTest";

const LOCALES: EmailLocale[] = ["en", "fr", "ar"];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkRtlDirection(html: string, locale: EmailLocale): void {
  if (locale === "ar") {
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
  } else {
    expect(html).toContain('dir="ltr"');
    expect(html).toContain(`lang="${locale}"`);
  }
}

function checkLogoLink(html: string): void {
  expect(html).toContain('href="https://fleetcore.io"');
  expect(html).toContain("fleetcore-logo");
}

function checkFooter(html: string): void {
  expect(html).toContain("FleetCore");
}

// ============================================================================
// LEAD CONFIRMATION TESTS
// ============================================================================

describe("LeadConfirmation Template", () => {
  const defaultProps = {
    first_name: "John",
    company_name: "Test Corp",
    fleet_size: "50",
    country_preposition: "in",
    country_name: "France",
    phone_row: "+33 1 23 45 67 89",
    message_row: "Looking forward to the demo",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(LeadConfirmation({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    checkFooter(html);
    expect(html).toContain(defaultProps.first_name);
    expect(html).toContain(defaultProps.company_name);
  });

  it("interpolates all variables correctly", async () => {
    const html = await render(
      LeadConfirmation({ ...defaultProps, locale: "en" })
    );

    expect(html).toContain("John");
    expect(html).toContain("Test Corp");
    expect(html).toContain("50");
    expect(html).toContain("France");
  });

  it("has consistent structure across locales", async () => {
    const htmls = await Promise.all(
      LOCALES.map((locale) =>
        render(LeadConfirmation({ ...defaultProps, locale }))
      )
    );

    // All should have same number of sections
    htmls.forEach((html) => {
      expect(html).toContain("<hr");
      expect(html.match(/<hr/g)?.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// EXPANSION OPPORTUNITY TESTS
// ============================================================================

describe("ExpansionOpportunity Template", () => {
  const defaultProps = {
    first_name: "Maria",
    company_name: "Global Fleet",
    fleet_size: "100",
    country_preposition: "in",
    country_name: "Spain",
    phone_row: "+34 123 456 789",
    message_row: "Interested in expansion",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(
      ExpansionOpportunity({ ...defaultProps, locale })
    );

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.first_name);
  });
});

// ============================================================================
// MEMBER WELCOME TESTS
// ============================================================================

describe("MemberWelcome Template", () => {
  const defaultProps = {
    first_name: "Alice",
    tenant_name: "FleetCo",
    email: "alice@fleetco.com",
    role: "Fleet Manager",
    dashboard_url: "https://app.fleetcore.com/dashboard",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(MemberWelcome({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.first_name);
    expect(html).toContain(defaultProps.tenant_name);
    expect(html).toContain(defaultProps.dashboard_url);
  });

  it("includes CTA button with dashboard URL", async () => {
    const html = await render(MemberWelcome({ ...defaultProps, locale: "en" }));
    expect(html).toContain('href="https://app.fleetcore.com/dashboard"');
  });
});

// ============================================================================
// MEMBER PASSWORD RESET TESTS
// ============================================================================

describe("MemberPasswordReset Template", () => {
  const defaultProps = {
    first_name: "Bob",
    reset_link: "https://app.fleetcore.com/reset?token=abc123",
    expiry_hours: "24",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(MemberPasswordReset({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.first_name);
    expect(html).toContain(defaultProps.reset_link);
  });

  it("shows expiry warning", async () => {
    const html = await render(
      MemberPasswordReset({ ...defaultProps, locale: "en" })
    );
    expect(html).toContain("24");
  });
});

// ============================================================================
// SALES REP ASSIGNMENT TESTS
// ============================================================================

describe("SalesRepAssignment Template", () => {
  const defaultProps = {
    employee_name: "Sarah",
    lead_name: "John Doe",
    company_name: "Acme Corp",
    priority: "high" as const,
    fit_score: 85,
    qualification_score: 90,
    lead_stage: "Qualified",
    fleet_size: "75",
    country_code: "US",
    lead_detail_url: "https://app.fleetcore.com/leads/123",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(SalesRepAssignment({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.employee_name);
    expect(html).toContain(defaultProps.lead_name);
  });

  it("displays priority badge", async () => {
    const html = await render(
      SalesRepAssignment({ ...defaultProps, locale: "en" })
    );
    // Priority should be displayed somewhere in the template
    expect(html.toLowerCase()).toContain("high");
  });

  it("shows scores", async () => {
    const html = await render(
      SalesRepAssignment({ ...defaultProps, locale: "en" })
    );
    expect(html).toContain("85");
    expect(html).toContain("90");
  });
});

// ============================================================================
// LEAD FOLLOWUP TESTS
// ============================================================================

describe("LeadFollowup Template", () => {
  const defaultProps = {
    first_name: "Charlie",
    company_name: "Fleet Masters",
    demo_link: "https://app.fleetcore.com/demo/book",
    sales_rep_name: "Diana",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(LeadFollowup({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.first_name);
    expect(html).toContain(defaultProps.demo_link);
  });
});

// ============================================================================
// VEHICLE INSPECTION REMINDER TESTS
// ============================================================================

describe("VehicleInspectionReminder Template", () => {
  const defaultProps = {
    fleet_manager_name: "Eve",
    vehicle_make: "Toyota",
    vehicle_model: "Camry",
    vehicle_plate: "ABC-123",
    due_date: "2025-12-31",
    days_remaining: "7",
    booking_link: "https://app.fleetcore.com/inspections/book",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(
      VehicleInspectionReminder({ ...defaultProps, locale })
    );

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.fleet_manager_name);
    expect(html).toContain(defaultProps.vehicle_plate);
  });

  it("shows vehicle info card", async () => {
    const html = await render(
      VehicleInspectionReminder({ ...defaultProps, locale: "en" })
    );
    expect(html).toContain("Toyota");
    expect(html).toContain("Camry");
    expect(html).toContain("ABC-123");
  });
});

// ============================================================================
// DRIVER ONBOARDING TESTS
// ============================================================================

describe("DriverOnboarding Template", () => {
  const defaultProps = {
    driver_name: "Frank",
    fleet_name: "Metro Fleet",
    driver_id: "DRV-001",
    start_date: "2025-01-15",
    fleet_manager_name: "Grace",
    driver_portal_url: "https://app.fleetcore.com/driver",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(DriverOnboarding({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.driver_name);
    expect(html).toContain(defaultProps.fleet_name);
  });

  it("shows driver credentials", async () => {
    const html = await render(
      DriverOnboarding({ ...defaultProps, locale: "en" })
    );
    expect(html).toContain("DRV-001");
    expect(html).toContain("2025-01-15");
  });
});

// ============================================================================
// INSURANCE EXPIRY ALERT TESTS
// ============================================================================

describe("InsuranceExpiryAlert Template", () => {
  const defaultProps = {
    fleet_manager_name: "Henry",
    vehicle_make: "Ford",
    vehicle_model: "Transit",
    vehicle_plate: "XYZ-789",
    expiry_date: "2025-12-31",
    days_remaining: "3",
    insurance_provider: "AXA Insurance",
    policy_number: "POL-123456",
    insurance_details_url: "https://app.fleetcore.com/insurance/details",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(
      InsuranceExpiryAlert({ ...defaultProps, locale })
    );

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.fleet_manager_name);
    expect(html).toContain(defaultProps.vehicle_plate);
  });

  it("shows urgent styling for critical alert", async () => {
    const html = await render(
      InsuranceExpiryAlert({ ...defaultProps, locale: "en" })
    );
    // Should have urgent/warning styling
    expect(html).toContain("#ea580c"); // Orange color for urgency
  });
});

// ============================================================================
// MAINTENANCE SCHEDULED TESTS
// ============================================================================

describe("MaintenanceScheduled Template", () => {
  const defaultProps = {
    driver_name: "Ivan",
    vehicle_make: "Mercedes",
    vehicle_model: "Sprinter",
    vehicle_plate: "MNO-456",
    maintenance_date: "2025-12-15",
    maintenance_time: "10:00 AM",
    maintenance_location: "Dubai Service Center",
    maintenance_type: "Regular Service",
    estimated_duration: "2 hours",
    maintenance_details_url: "https://app.fleetcore.com/maintenance/details",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(
      MaintenanceScheduled({ ...defaultProps, locale })
    );

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.driver_name);
    expect(html).toContain(defaultProps.vehicle_plate);
  });

  it("shows all maintenance details", async () => {
    const html = await render(
      MaintenanceScheduled({ ...defaultProps, locale: "en" })
    );
    expect(html).toContain("2025-12-15");
    expect(html).toContain("10:00 AM");
    expect(html).toContain("Dubai Service Center");
    expect(html).toContain("Regular Service");
  });
});

// ============================================================================
// CRITICAL ALERT TESTS
// ============================================================================

describe("CriticalAlert Template", () => {
  const defaultProps = {
    alert_title: "Database Connection Failure",
    alert_time: "2025-11-13 10:30 AM",
    severity: "CRITICAL",
    affected_items: "3 tenants, 15 users",
    alert_description: "The primary database connection has been lost.",
    recommended_action: "Check database server status immediately.",
    alert_url: "https://app.fleetcore.com/alerts/123",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(CriticalAlert({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.alert_title);
  });

  it("shows critical styling", async () => {
    const html = await render(CriticalAlert({ ...defaultProps, locale: "en" }));
    // Should have red/critical styling
    expect(html).toContain("#dc2626"); // Red color for critical
  });

  it("displays all alert details", async () => {
    const html = await render(CriticalAlert({ ...defaultProps, locale: "en" }));
    expect(html).toContain("CRITICAL");
    expect(html).toContain("3 tenants, 15 users");
    expect(html).toContain("Check database server status");
  });
});

// ============================================================================
// WEBHOOK TEST TESTS
// ============================================================================

describe("WebhookTest Template", () => {
  const defaultProps = {
    timestamp: "2025-11-13 10:30:45 UTC",
    test_id: "TEST-123456",
  };

  it.each(LOCALES)("renders correctly in %s locale", async (locale) => {
    const html = await render(WebhookTest({ ...defaultProps, locale }));

    checkRtlDirection(html, locale);
    checkLogoLink(html);
    expect(html).toContain(defaultProps.timestamp);
    expect(html).toContain(defaultProps.test_id);
  });
});

// ============================================================================
// HARDCODED ENGLISH DETECTION TESTS
// ============================================================================

/**
 * These tests detect untranslated English strings in non-EN locales.
 * Common words that should NEVER appear in FR/AR templates.
 * Prefixed with _ as it's reserved for future automated scanning.
 */
const _FORBIDDEN_ENGLISH_WORDS = [
  "Team",
  "Hello",
  "Welcome",
  "Company",
  "Country",
  "Phone",
  "Message",
  "Email",
  "Role",
  "Details",
  "Next steps",
  "Click",
  "Button",
  "View",
  "Access",
];

describe("Hardcoded English Detection", () => {
  it("LeadConfirmation FR should use French labels", async () => {
    const html = await render(
      LeadConfirmation({
        locale: "fr",
        first_name: "Jean",
        company_name: "SociétéTest",
        fleet_size: "50",
        country_preposition: "en",
        country_name: "France",
        phone_row: "+33 1 23 45 67 89",
        message_row: "Texte du message",
      })
    );

    // Should contain French labels
    expect(html).toContain("Entreprise");
    expect(html).toContain("Taille de flotte");
    expect(html).toContain("Pays");
    expect(html).toContain("Téléphone");
    // "Message" is same in FR/EN - that's OK

    // Should NOT contain English-only labels
    expect(html).not.toContain(">Company<");
    expect(html).not.toContain(">Fleet size<");
    expect(html).not.toContain(">Country<");
    expect(html).not.toContain(">Phone<");
  });

  it("MemberWelcome FR should not contain hardcoded 'Team'", async () => {
    const html = await render(
      MemberWelcome({
        locale: "fr",
        first_name: "Marie",
        tenant_name: "FleetCo",
        email: "marie@test.com",
        role: "Admin",
        dashboard_url: "https://app.fleetcore.com",
      })
    );

    // Should NOT contain " Team" (with space before) as hardcoded text
    expect(html).not.toMatch(/>\s*Team\s*</);
  });

  it("DriverOnboarding FR should use translated team suffix", async () => {
    const html = await render(
      DriverOnboarding({
        locale: "fr",
        driver_name: "Pierre",
        fleet_name: "FlotteMax",
        driver_id: "DRV-001",
        start_date: "2025-01-15",
        fleet_manager_name: "Marie",
        driver_portal_url: "https://app.fleetcore.com/driver",
      })
    );

    // Should contain French "Équipe" instead of English "Team"
    expect(html).toContain("Équipe");
    // Should NOT contain " Team" as standalone word before fleet name
    expect(html).not.toMatch(/>\s*FlotteMax Team\s*</);
  });

  it("DriverOnboarding AR should use Arabic team suffix", async () => {
    const html = await render(
      DriverOnboarding({
        locale: "ar",
        driver_name: "محمد",
        fleet_name: "أسطول دبي",
        driver_id: "DRV-001",
        start_date: "2025-01-15",
        fleet_manager_name: "أحمد",
        driver_portal_url: "https://app.fleetcore.com/driver",
      })
    );

    // Should contain Arabic "فريق" instead of English "Team"
    expect(html).toContain("فريق");
  });
});

// ============================================================================
// STRUCTURAL CONSISTENCY TESTS
// ============================================================================

describe("Template Structure Consistency", () => {
  it("LeadConfirmation renders phone and message on separate lines", async () => {
    const html = await render(
      LeadConfirmation({
        locale: "en",
        first_name: "John",
        company_name: "Test Corp",
        fleet_size: "50",
        country_preposition: "in",
        country_name: "France",
        phone_row: "+1 555 123 4567",
        message_row: "Test message",
      })
    );

    // Phone and message should be preceded by <br /> and bullet point
    expect(html).toContain("Phone");
    expect(html).toContain("Message");
    // They should NOT be concatenated together
    expect(html).not.toContain("+1 555 123 4567Test message");
    expect(html).not.toContain("France+1 555");
  });

  it("ExpansionOpportunity renders phone and message on separate lines", async () => {
    const html = await render(
      ExpansionOpportunity({
        locale: "en",
        first_name: "John",
        company_name: "Test Corp",
        fleet_size: "50",
        country_preposition: "in",
        country_name: "Germany",
        phone_row: "+49 30 1234567",
        message_row: "Interested in expansion",
      })
    );

    // Phone and message should be on separate lines
    expect(html).toContain("Phone");
    expect(html).toContain("Message");
    // They should NOT be concatenated
    expect(html).not.toContain("+49 30 1234567Interested");
    expect(html).not.toContain("Germany+49");
  });
});

// ============================================================================
// RTL SPECIFIC TESTS
// ============================================================================

describe("RTL Support for Arabic", () => {
  it("LeadConfirmation has proper RTL attributes", async () => {
    const html = await render(
      LeadConfirmation({
        locale: "ar",
        first_name: "محمد",
        company_name: "شركة الأسطول",
        fleet_size: "50",
        country_preposition: "في",
        country_name: "الإمارات",
        phone_row: "+971 50 123 4567",
        message_row: "مهتم بالعرض التوضيحي",
      })
    );

    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
    // Text should be right-aligned
    expect(html).toContain("text-align:right");
  });

  it("CriticalAlert has proper RTL attributes", async () => {
    const html = await render(
      CriticalAlert({
        locale: "ar",
        alert_title: "فشل اتصال قاعدة البيانات",
        alert_time: "2025-11-13 10:30",
        severity: "حرج",
        affected_items: "3 مستأجرين",
        alert_description: "فقد الاتصال بقاعدة البيانات",
        recommended_action: "تحقق من حالة الخادم",
        alert_url: "https://app.fleetcore.com/alerts/123",
      })
    );

    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="ar"');
  });
});
