"use client";

/**
 * Verification Content Component - V6.2-8b
 *
 * Client component that handles:
 * - Token validation on mount
 * - Form display and submission
 * - Error states (invalid, expired, already used)
 * - Success redirect
 *
 * @module app/[locale]/(public)/verify/verification-content
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Building,
  User,
  FileText,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface VerificationContentProps {
  token?: string;
  locale: string;
}

interface TokenValidationResult {
  success: boolean;
  data?: {
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    countryCode: string;
  };
  error?: string;
  errorCode?: string;
  expired?: boolean;
  alreadyVerified?: boolean;
}

interface Country {
  id: string;
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  country_name_ar: string;
  flag_emoji: string;
  is_operational: boolean;
}

// Tax ID validation rules per country
const TAX_ID_RULES: Record<string, { pattern: RegExp; maxLength: number }> = {
  FR: { pattern: /^[0-9]{14}$/, maxLength: 14 },
  DE: { pattern: /^[0-9]{10,11}$|^DE[0-9]{9}$/, maxLength: 12 },
  ES: { pattern: /^[A-Z0-9]{9}$/, maxLength: 9 },
  IT: { pattern: /^[0-9]{11}$|^[A-Z0-9]{16}$/, maxLength: 16 },
  BE: { pattern: /^[0-9]{10}$|^BE[0-9]{10}$/, maxLength: 12 },
  NL: { pattern: /^[0-9]{8}$|^NL[A-Z0-9]{12}$/, maxLength: 14 },
  AE: { pattern: /^[0-9]{15}$/, maxLength: 15 },
  SA: { pattern: /^[0-9]{15}$/, maxLength: 15 },
  QA: { pattern: /^.{1,20}$/, maxLength: 20 },
};

interface FormData {
  company_legal_name: string;
  company_siret: string;
  company_address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  admin_name: string;
  admin_email: string;
  cgi_accepted: boolean;
}

export default function VerificationContent({
  token,
  locale,
}: VerificationContentProps) {
  const { t } = useTranslation("public");
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [_tokenValid, setTokenValid] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<{
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    countryCode: string;
  } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [errorState, setErrorState] = useState<{
    type: "invalid" | "expired" | "already_used" | "error";
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    company_legal_name: "",
    company_siret: "",
    company_address: {
      street: "",
      city: "",
      postal_code: "",
      country: "",
    },
    admin_name: "",
    admin_email: "",
    cgi_accepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/public/countries");
        const result = await response.json();
        if (result.success && result.data) {
          setCountries(result.data);
        }
      } catch (_error) {
        // Silently fail - countries list is non-critical
      }
    };
    void fetchCountries();
  }, []);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsLoading(false);
        setErrorState({
          type: "invalid",
          message: t("verify.errors.missingToken"),
        });
        return;
      }

      try {
        const response = await fetch(
          `/api/public/verify?token=${encodeURIComponent(token)}`
        );
        const result: TokenValidationResult = await response.json();

        if (result.success && result.data) {
          const data = result.data;
          setTokenValid(true);
          setTenantInfo(data);
          setFormData((prev) => ({
            ...prev,
            company_legal_name: data.tenantName || "",
            company_address: {
              ...prev.company_address,
              country: data.countryCode || "",
            },
          }));
        } else {
          const errorType = result.expired
            ? "expired"
            : result.alreadyVerified
              ? "already_used"
              : "invalid";

          setErrorState({
            type: errorType,
            message: result.error || t("verify.errors.invalidToken"),
          });
        }
      } catch (_error) {
        setErrorState({
          type: "error",
          message: t("verify.errors.networkError"),
        });
      } finally {
        setIsLoading(false);
      }
    };

    void validateToken();
  }, [token, t]);

  // Get country name based on locale
  const getCountryName = (countryCode: string): string => {
    const country = countries.find((c) => c.country_code === countryCode);
    if (!country) return countryCode;

    switch (locale) {
      case "fr":
        return country.country_name_fr;
      case "ar":
        return country.country_name_ar;
      default:
        return country.country_name_en;
    }
  };

  // Get country flag
  const getCountryFlag = (countryCode: string): string => {
    const country = countries.find((c) => c.country_code === countryCode);
    return country?.flag_emoji || "";
  };

  // Get Tax ID label/placeholder based on country
  const getTaxIdConfig = (countryCode: string) => {
    const hasCountryConfig = [
      "FR",
      "DE",
      "ES",
      "IT",
      "BE",
      "NL",
      "AE",
      "SA",
      "QA",
    ].includes(countryCode);

    if (hasCountryConfig) {
      return {
        label: t(`verify.form.taxId.${countryCode}.label`),
        placeholder: t(`verify.form.taxId.${countryCode}.placeholder`),
        help: t(`verify.form.taxId.${countryCode}.help`),
        maxLength: TAX_ID_RULES[countryCode]?.maxLength || 20,
      };
    }

    return {
      label: t("verify.form.taxId.label"),
      placeholder: t("verify.form.taxId.placeholder"),
      help: "",
      maxLength: 20,
    };
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const countryCode = tenantInfo?.countryCode || "";

    if (!formData.company_legal_name.trim()) {
      newErrors.company_legal_name = t("verify.form.errors.required");
    }

    if (!formData.admin_name.trim()) {
      newErrors.admin_name = t("verify.form.errors.required");
    }

    if (!formData.admin_email.trim()) {
      newErrors.admin_email = t("verify.form.errors.required");
    } else if (!/\S+@\S+\.\S+/.test(formData.admin_email)) {
      newErrors.admin_email = t("verify.form.errors.invalidEmail");
    }

    // Dynamic Tax ID validation based on country
    if (formData.company_siret) {
      const rule = TAX_ID_RULES[countryCode];
      if (rule && !rule.pattern.test(formData.company_siret)) {
        newErrors.company_siret = t("verify.form.errors.invalidTaxId");
      }
    }

    if (!formData.cgi_accepted) {
      newErrors.cgi_accepted = t("verify.form.errors.mustAcceptTerms");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/public/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...formData,
          company_address:
            formData.company_address.street ||
            formData.company_address.city ||
            formData.company_address.postal_code
              ? formData.company_address
              : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to success page
        router.push(`/${locale}/verify/success?code=${result.data.tenantCode}`);
      } else {
        if (result.errorCode === "TOKEN_EXPIRED") {
          setErrorState({ type: "expired", message: result.error });
          setTokenValid(false);
        } else if (result.errorCode === "TOKEN_ALREADY_USED") {
          setErrorState({ type: "already_used", message: result.error });
          setTokenValid(false);
        } else if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ submit: result.error || "An error occurred" });
        }
      }
    } catch (_error) {
      setErrors({
        submit: t(
          "verify.errors.networkError",
          "Unable to submit. Please try again."
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.replace("address.", "");
      setFormData((prev) => ({
        ...prev,
        company_address: {
          ...prev.company_address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-slate-300">{t("verify.loading")}</p>
        </div>
      </div>
    );
  }

  // Error states
  if (errorState) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-slate-800/50 p-8 text-center backdrop-blur-sm"
        >
          {errorState.type === "expired" && (
            <>
              <Clock className="mx-auto h-16 w-16 text-amber-500" />
              <h1 className="mt-4 text-2xl font-bold text-white">
                {t("verify.expired.title")}
              </h1>
              <p className="mt-2 text-slate-300">{errorState.message}</p>
              <p className="mt-4 text-sm text-slate-400">
                {t("verify.expired.help")}
              </p>
            </>
          )}

          {errorState.type === "already_used" && (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h1 className="mt-4 text-2xl font-bold text-white">
                {t("verify.alreadyUsed.title")}
              </h1>
              <p className="mt-2 text-slate-300">{errorState.message}</p>
              <Link
                href={`/${locale}/login`}
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              >
                {t("verify.alreadyUsed.loginButton")}
              </Link>
            </>
          )}

          {errorState.type === "invalid" && (
            <>
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
              <h1 className="mt-4 text-2xl font-bold text-white">
                {t("verify.invalid.title")}
              </h1>
              <p className="mt-2 text-slate-300">{errorState.message}</p>
              <p className="mt-4 text-sm text-slate-400">
                {t("verify.invalid.help")}
              </p>
            </>
          )}

          {errorState.type === "error" && (
            <>
              <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" />
              <h1 className="mt-4 text-2xl font-bold text-white">
                {t("verify.error.title")}
              </h1>
              <p className="mt-2 text-slate-300">{errorState.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              >
                {t("verify.error.retryButton")}
              </button>
            </>
          )}

          <div className="mt-8 text-sm text-slate-400">
            {t("verify.support")}{" "}
            <a
              href="mailto:support@fleetcore.io"
              className="text-blue-400 hover:underline"
            >
              support@fleetcore.io
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Verification form
  return (
    <div className="flex min-h-screen items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-2xl bg-slate-800/50 p-8 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t("verify.title")}</h1>
          <p className="mt-2 text-slate-300">{t("verify.subtitle")}</p>
          {tenantInfo && (
            <p className="mt-2 text-sm text-slate-400">
              {t("verify.accountCode")}:{" "}
              <span className="text-base font-bold text-white">
                {tenantInfo.tenantCode}
              </span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Section */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Building className="h-5 w-5 text-blue-400" />
              {t("verify.form.companySection")}
            </h2>

            {/* Country (read-only, pre-filled) */}
            {tenantInfo?.countryCode && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">
                  {t("verify.form.country")}
                </label>
                <div className="flex w-full items-center gap-3 rounded-lg border border-slate-600 bg-slate-900/30 px-4 py-3 text-white">
                  <span className="text-2xl">
                    {getCountryFlag(tenantInfo.countryCode)}
                  </span>
                  <span className="font-medium">
                    {getCountryName(tenantInfo.countryCode)}
                  </span>
                  <span className="text-slate-400">
                    ({tenantInfo.countryCode})
                  </span>
                </div>
              </div>
            )}

            {/* Company Legal Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-200">
                {t("verify.form.companyLegalName")} *
              </label>
              <input
                type="text"
                name="company_legal_name"
                value={formData.company_legal_name}
                onChange={handleChange}
                placeholder={t("verify.form.companyLegalNamePlaceholder")}
                className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:outline-none ${
                  errors.company_legal_name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-600 focus:ring-blue-500"
                }`}
              />
              {errors.company_legal_name && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.company_legal_name}
                </p>
              )}
            </div>

            {/* Dynamic Tax ID based on country */}
            {(() => {
              const taxIdConfig = getTaxIdConfig(tenantInfo?.countryCode || "");
              return (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-200">
                    {taxIdConfig.label}
                  </label>
                  <input
                    type="text"
                    name="company_siret"
                    value={formData.company_siret}
                    onChange={handleChange}
                    placeholder={taxIdConfig.placeholder}
                    maxLength={taxIdConfig.maxLength}
                    className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:outline-none ${
                      errors.company_siret
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-600 focus:ring-blue-500"
                    }`}
                  />
                  {taxIdConfig.help && (
                    <p className="mt-1 text-xs text-slate-400">
                      {taxIdConfig.help}
                    </p>
                  )}
                  {errors.company_siret && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.company_siret}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Address */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-200">
                <MapPin className="h-4 w-4" />
                {t("verify.form.address")}
              </label>
              <div className="grid gap-3">
                <input
                  type="text"
                  name="address.street"
                  value={formData.company_address.street}
                  onChange={handleChange}
                  placeholder={t("verify.form.street")}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="address.city"
                    value={formData.company_address.city}
                    onChange={handleChange}
                    placeholder={t("verify.form.city")}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="address.postal_code"
                    value={formData.company_address.postal_code}
                    onChange={handleChange}
                    placeholder={t("verify.form.postalCode")}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Section */}
          <div className="space-y-4 border-t border-slate-700 pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <User className="h-5 w-5 text-blue-400" />
              {t("verify.form.adminSection")}
            </h2>
            <p className="text-sm text-slate-400">
              {t("verify.form.adminDescription")}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Admin Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">
                  {t("verify.form.adminName")} *
                </label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  placeholder={t("verify.form.adminNamePlaceholder")}
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:outline-none ${
                    errors.admin_name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-600 focus:ring-blue-500"
                  }`}
                />
                {errors.admin_name && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.admin_name}
                  </p>
                )}
              </div>

              {/* Admin Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">
                  {t("verify.form.adminEmail")} *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  placeholder={t("verify.form.adminEmailPlaceholder")}
                  className={`w-full rounded-lg border bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:outline-none ${
                    errors.admin_email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-600 focus:ring-blue-500"
                  }`}
                />
                {errors.admin_email && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.admin_email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Terms Section */}
          <div className="space-y-4 border-t border-slate-700 pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <FileText className="h-5 w-5 text-blue-400" />
              {t("verify.form.termsSection")}
            </h2>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="cgi_accepted"
                checked={formData.cgi_accepted}
                onChange={handleChange}
                className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-900/50 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                {t("verify.form.termsText")}{" "}
                <Link
                  href={`/${locale}/terms`}
                  target="_blank"
                  className="text-blue-400 hover:underline"
                >
                  {t("verify.form.readTerms")}
                </Link>
              </span>
            </label>
            {errors.cgi_accepted && (
              <p className="text-sm text-red-400">{errors.cgi_accepted}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg bg-red-500/10 p-4 text-center text-red-400">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("verify.form.submitting")}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                {t("verify.form.submit")}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
