import { useMemo } from "react";

/**
 * Country type with GDPR flag
 */
interface Country {
  country_code: string;
  country_gdpr: boolean;
}

/**
 * Return type for useGdprValidation hook
 */
interface GdprValidationResult {
  /** Whether the selected country requires GDPR consent */
  requiresGdpr: boolean;
  /** Whether the form is valid (consent given if required) */
  isValid: boolean;
  /** Error message if validation fails */
  errorMessage: string | null;
}

/**
 * GDPR Validation Hook
 *
 * Validates GDPR consent requirement based on selected country.
 * Used to disable submit buttons and show validation errors.
 *
 * Business Logic:
 * - If country is EU/EEA (country_gdpr = true) → consent required
 * - If country is non-EU/EEA → no consent needed
 * - Form is valid if: (not GDPR required) OR (GDPR required AND consented)
 *
 * @param countries - List of countries with GDPR flags
 * @param selectedCountryCode - Currently selected country (2-letter ISO code)
 * @param gdprConsent - Current consent state (true/false)
 *
 * @returns Validation result with requiresGdpr, isValid, errorMessage
 *
 * @example
 * ```typescript
 * const { requiresGdpr, isValid } = useGdprValidation(
 *   countries,
 *   formData.country_code,
 *   formData.gdpr_consent
 * );
 *
 * // Disable submit if invalid
 * <button disabled={!isValid}>Submit</button>
 * ```
 */
export function useGdprValidation(
  countries: Country[],
  selectedCountryCode: string | null,
  gdprConsent: boolean
): GdprValidationResult {
  // Memoize GDPR requirement check
  const requiresGdpr = useMemo(() => {
    if (!selectedCountryCode) return false;

    const country = countries.find(
      (c) => c.country_code === selectedCountryCode
    );

    return country?.country_gdpr || false;
  }, [countries, selectedCountryCode]);

  // Form is valid if GDPR not required OR consent given
  const isValid = !requiresGdpr || gdprConsent;

  // Generate error message if invalid
  const errorMessage =
    requiresGdpr && !gdprConsent
      ? "GDPR consent required for EU/EEA countries"
      : null;

  return {
    requiresGdpr,
    isValid,
    errorMessage,
  };
}
