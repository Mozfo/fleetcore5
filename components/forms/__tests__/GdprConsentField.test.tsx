/**
 * GdprConsentField Component Tests
 *
 * Tests conditional GDPR consent checkbox display and validation
 * for EU/EEA countries in marketing forms.
 *
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GdprConsentField } from "../GdprConsentField";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "gdpr.title": "GDPR Consent Required",
        "gdpr.explanation":
          "Your data will be processed in accordance with EU GDPR regulations.",
        "gdpr.consent":
          "I consent to the processing of my personal data and accept the",
        "gdpr.privacyPolicy": "Privacy Policy",
        "gdpr.required": "You must accept the privacy policy to continue",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("GdprConsentField", () => {
  const mockCountries = [
    {
      id: "1",
      country_code: "AE",
      country_name_en: "United Arab Emirates",
      country_name_fr: "Émirats Arabes Unis",
      country_name_ar: "الإمارات العربية المتحدة",
      flag_emoji: "🇦🇪",
      is_operational: true,
      country_gdpr: false, // Non-GDPR country
      display_order: 1,
    },
    {
      id: "2",
      country_code: "FR",
      country_name_en: "France",
      country_name_fr: "France",
      country_name_ar: "فرنسا",
      flag_emoji: "🇫🇷",
      is_operational: true,
      country_gdpr: true, // GDPR country
      display_order: 2,
    },
  ];

  const mockOnChange = vi.fn();

  it("should hide checkbox for non-GDPR country (UAE)", () => {
    const { container } = render(
      <GdprConsentField
        countries={mockCountries}
        selectedCountryCode="AE"
        value={false}
        onChange={mockOnChange}
        locale="en"
      />
    );

    // Component should return null (no rendering)
    expect(container.firstChild).toBeNull();
  });

  it("should show checkbox for GDPR country (France)", () => {
    render(
      <GdprConsentField
        countries={mockCountries}
        selectedCountryCode="FR"
        value={false}
        onChange={mockOnChange}
        locale="en"
      />
    );

    // Verify blue info box appears
    expect(screen.getByText("GDPR Consent Required")).toBeInTheDocument();
    expect(screen.getByText(/Your data will be processed/)).toBeInTheDocument();

    // Verify consent checkbox exists
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // Verify Privacy Policy link
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("should show validation error if consent required but not given", () => {
    render(
      <GdprConsentField
        countries={mockCountries}
        selectedCountryCode="FR"
        value={false} // Not consented
        onChange={mockOnChange}
        locale="en"
      />
    );

    // Verify red validation message appears
    expect(
      screen.getByText(/You must accept the privacy policy to continue/)
    ).toBeInTheDocument();
  });
});
