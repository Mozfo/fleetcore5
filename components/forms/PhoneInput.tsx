/**
 * PhoneInput Component
 *
 * Phone input with EDITABLE country prefix.
 * Default prefix is based on lead's country but user can change it.
 *
 * V6.2.4: Added dropdown to select phone prefix independently
 * (user may live in UAE but have a French phone number)
 *
 * @module components/forms/PhoneInput
 */

"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { Phone, ChevronDown } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Country {
  country_code: string;
  country_name_en?: string;
  country_name_fr?: string;
  flag_emoji?: string | null;
  phone_prefix: string | null;
  phone_example: string | null;
  phone_min_digits?: number | null;
  phone_max_digits?: number | null;
}

interface PhoneInputProps {
  /** List of countries with phone_prefix */
  countries: Country[];
  /** Default country code for prefix (ISO 2-letter) - can be changed by user */
  selectedCountryCode: string;
  /** Current phone value (without prefix) */
  value: string;
  /** Called when phone value changes */
  onChange: (value: string) => void;
  /** Called when prefix country changes (optional) */
  onPrefixChange?: (countryCode: string) => void;
  /** Called when validation state changes (optional) */
  onValidationChange?: (isValid: boolean) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Has validation error */
  hasError?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Locale for country names */
  locale?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PhoneInput({
  countries,
  selectedCountryCode,
  value,
  onChange,
  onPrefixChange,
  onValidationChange,
  placeholder = "Phone number",
  hasError = false,
  className = "",
  locale = "en",
}: PhoneInputProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const [prefixCountryCode, setPrefixCountryCode] =
    useState(selectedCountryCode);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize prefix country from prop
  useEffect(() => {
    if (selectedCountryCode && !prefixCountryCode) {
      setPrefixCountryCode(selectedCountryCode);
    }
  }, [selectedCountryCode, prefixCountryCode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get countries with phone prefix, sorted by prefix
  const countriesWithPrefix = useMemo(() => {
    return countries
      .filter((c) => c.phone_prefix)
      .sort((a, b) => {
        // Sort by phone_prefix numerically
        const prefixA = parseInt(a.phone_prefix?.replace(/\D/g, "") || "0");
        const prefixB = parseInt(b.phone_prefix?.replace(/\D/g, "") || "0");
        return prefixA - prefixB;
      });
  }, [countries]);

  // Get the selected prefix country
  const selectedPrefixCountry = useMemo(() => {
    return countriesWithPrefix.find(
      (c) => c.country_code === prefixCountryCode
    );
  }, [countriesWithPrefix, prefixCountryCode]);

  // Get phone_example for the selected country
  const phoneExample = selectedPrefixCountry?.phone_example || null;

  // Dynamic placeholder
  const dynamicPlaceholder = phoneExample || placeholder;

  // Phone validation based on country rules
  const minDigits = selectedPrefixCountry?.phone_min_digits ?? 8;
  const maxDigits = selectedPrefixCountry?.phone_max_digits ?? 12;

  // Validate phone number length
  useEffect(() => {
    const digits = localValue.replace(/\D/g, "");
    const digitCount = digits.length;

    if (digitCount === 0) {
      setValidationWarning(null);
      onValidationChange?.(true); // Empty is valid (required check is separate)
      return;
    }

    if (digitCount < minDigits) {
      const msg =
        locale === "fr"
          ? `Numéro trop court (${digitCount}/${minDigits} chiffres min)`
          : `Number too short (${digitCount}/${minDigits} digits min)`;
      setValidationWarning(msg);
      onValidationChange?.(false);
    } else if (digitCount > maxDigits) {
      const msg =
        locale === "fr"
          ? `Numéro trop long (${digitCount}/${maxDigits} chiffres max)`
          : `Number too long (${digitCount}/${maxDigits} digits max)`;
      setValidationWarning(msg);
      onValidationChange?.(false);
    } else {
      setValidationWarning(null);
      onValidationChange?.(true);
    }
  }, [localValue, minDigits, maxDigits, locale, onValidationChange]);

  // Sync external value with local state
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  // Format phone number (remove non-digits)
  const formatPhoneNumber = (input: string): string => {
    const phonePrefix = selectedPrefixCountry?.phone_prefix;
    // If user pastes a full number with prefix, strip the prefix
    if (phonePrefix && input.startsWith(phonePrefix)) {
      input = input.slice(phonePrefix.length);
    }
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, "");
    // Return cleaned digits (max 15 digits per E.164 standard)
    return digits.slice(0, 15);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setLocalValue(formatted);
    onChange(formatted);
  };

  // Handle prefix country selection
  const handlePrefixSelect = (countryCode: string) => {
    setPrefixCountryCode(countryCode);
    setIsDropdownOpen(false);
    onPrefixChange?.(countryCode);
  };

  // Parse the formatting pattern from phone_example
  // e.g., "521 410 01" → [3, 3, 2] (group sizes)
  const formatPattern = useMemo(() => {
    if (!phoneExample) return null;
    // Extract groups separated by spaces
    const groups = phoneExample.trim().split(/\s+/);
    // Get the length of each group
    return groups.map((group) => group.replace(/\D/g, "").length);
  }, [phoneExample]);

  // Display value with proper formatting based on country's phone_example pattern
  const displayValue = useMemo(() => {
    if (!localValue) return "";
    const digits = localValue.replace(/\D/g, "");

    if (!formatPattern || formatPattern.length === 0) {
      // Fallback: generic formatting if no pattern
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 9)
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }

    // Apply the country-specific pattern
    const parts: string[] = [];
    let position = 0;

    for (const groupSize of formatPattern) {
      if (position >= digits.length) break;
      const chunk = digits.slice(position, position + groupSize);
      if (chunk) parts.push(chunk);
      position += groupSize;
    }

    // Add remaining digits (if any) as the last group
    if (position < digits.length) {
      parts.push(digits.slice(position));
    }

    return parts.join(" ");
  }, [localValue, formatPattern]);

  // Get country name based on locale
  const getCountryName = (country: Country) => {
    if (locale === "fr" && country.country_name_fr) {
      return country.country_name_fr;
    }
    return country.country_name_en || country.country_code;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`flex w-full overflow-hidden rounded-lg border ${
          hasError
            ? "border-red-500"
            : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-700"
        }`}
      >
        {/* Phone Prefix Dropdown */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 border-r border-gray-300 bg-gray-50 px-2 py-3 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <Phone className="h-4 w-4 text-gray-500 dark:text-slate-400" />
          {selectedPrefixCountry?.flag_emoji && (
            <span className="text-base">
              {selectedPrefixCountry.flag_emoji}
            </span>
          )}
          <span className="min-w-[45px] text-sm font-medium text-gray-700 dark:text-slate-300">
            {selectedPrefixCountry?.phone_prefix || "---"}
          </span>
          <ChevronDown className="h-3 w-3 text-gray-400 dark:text-slate-500" />
        </button>

        {/* Phone Input */}
        <input
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={dynamicPlaceholder}
          className="flex-1 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500"
        />
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {countriesWithPrefix.map((country) => (
            <button
              key={country.country_code}
              type="button"
              onClick={() => handlePrefixSelect(country.country_code)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-700 ${
                country.country_code === prefixCountryCode
                  ? "bg-blue-50 dark:bg-blue-500/10"
                  : ""
              }`}
            >
              {country.flag_emoji && (
                <span className="text-lg">{country.flag_emoji}</span>
              )}
              <span className="flex-1 text-sm text-gray-700 dark:text-slate-300">
                {getCountryName(country)}
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {country.phone_prefix}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Helper text showing full number */}
      {selectedPrefixCountry?.phone_prefix && localValue && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
          {selectedPrefixCountry.phone_prefix} {displayValue}
        </p>
      )}

      {/* Validation warning */}
      {validationWarning && (
        <p className="mt-1 text-xs font-medium text-orange-600 dark:text-orange-400">
          ⚠️ {validationWarning}
        </p>
      )}
    </div>
  );
}
