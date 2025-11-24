/**
 * useGdprValidation Hook Tests
 *
 * Tests GDPR validation logic for submit button state
 * in marketing forms with country-based consent requirements.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGdprValidation } from "../useGdprValidation";

describe("useGdprValidation", () => {
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

  it("should return requiresGdpr: false for non-GDPR country", () => {
    const { result } = renderHook(() =>
      useGdprValidation(mockCountries, "AE", false)
    );

    expect(result.current.requiresGdpr).toBe(false);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it("should return isValid: false for GDPR country without consent", () => {
    const { result } = renderHook(() =>
      useGdprValidation(mockCountries, "FR", false)
    );

    expect(result.current.requiresGdpr).toBe(true);
    expect(result.current.isValid).toBe(false);
    expect(result.current.errorMessage).toBe(
      "GDPR consent required for EU/EEA countries"
    );
  });

  it("should return isValid: true for GDPR country with consent", () => {
    const { result } = renderHook(() =>
      useGdprValidation(mockCountries, "FR", true)
    );

    expect(result.current.requiresGdpr).toBe(true);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });
});
