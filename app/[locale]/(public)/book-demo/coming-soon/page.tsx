/**
 * Coming Soon Page - Waitlist Confirmation
 *
 * V6.2.3 - Page de confirmation pour les leads des pays non-opérationnels
 *
 * Route: /book-demo/coming-soon?email=xxx&country=XX
 *
 * @module app/[locale]/(public)/book-demo/coming-soon/page
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Globe, Gift, CheckCircle, ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

interface Country {
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  country_name_ar: string;
  flag_emoji: string | null;
  is_operational: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ComingSoonPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { t, i18n } = useTranslation("public");

  // Get params from URL
  const email = searchParams.get("email") || "";
  const countryCode = searchParams.get("country") || "";

  // State
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // Initialize i18n
  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Fetch countries to get names
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/public/countries");
        const data = await res.json();
        if (data.success && data.data) {
          setCountries(data.data);
          const found = data.data.find(
            (c: Country) => c.country_code === countryCode
          );
          if (found) {
            setSelectedCountry(found);
          }
        }
      } catch (_error) {
        // Silently fail
      }
    };
    void fetchCountries();
  }, [countryCode]);

  // Get country name based on locale
  const getCountryName = (country: Country) => {
    switch (locale) {
      case "fr":
        return country.country_name_fr;
      case "ar":
        return country.country_name_ar;
      default:
        return country.country_name_en;
    }
  };

  // Get operational countries for display
  const operationalCountries = useMemo(() => {
    return countries.filter((c) => c.is_operational);
  }, [countries]);

  // Mask email for privacy (show first 3 chars + domain)
  const maskedEmail = useMemo(() => {
    if (!email || !email.includes("@")) return email;
    const [local, domain] = email.split("@");
    const masked = local.length > 3 ? `${local.slice(0, 3)}***` : `${local}***`;
    return `${masked}@${domain}`;
  }, [email]);

  const countryName = selectedCountry
    ? getCountryName(selectedCountry)
    : countryCode;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Card */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800/50 dark:shadow-none dark:backdrop-blur-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
            <Globe className="h-10 w-10 text-blue-600 dark:text-blue-500" />
          </div>

          {/* Title */}
          <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            {selectedCountry?.flag_emoji && (
              <span className="mr-2">{selectedCountry.flag_emoji}</span>
            )}
            {t("bookDemo.comingSoon.title", { country: countryName })}
          </h1>

          {/* Subtitle */}
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            {t("bookDemo.comingSoon.subtitle", { country: countryName })}
          </p>

          {/* Incentive Box */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mb-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-5 dark:from-blue-500/10 dark:to-purple-500/10"
          >
            <div className="flex items-center justify-center gap-3">
              <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-300">
                {t("bookDemo.comingSoon.incentive")}
              </span>
            </div>
          </motion.div>

          {/* Confirmation */}
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {t("bookDemo.comingSoon.confirmed", { email: maskedEmail })}
            </span>
          </div>

          {/* Available Countries */}
          {operationalCountries.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-gray-500 dark:text-slate-500">
                {t("bookDemo.comingSoon.availableIn")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {operationalCountries.map((country) => (
                  <div
                    key={country.country_code}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm dark:bg-slate-700"
                  >
                    {country.flag_emoji && <span>{country.flag_emoji}</span>}
                    <span className="text-gray-700 dark:text-slate-300">
                      {getCountryName(country)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back to Home Button */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("bookDemo.comingSoon.backHome")}
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-slate-500">
          <MapPin className="mr-1 inline h-3 w-3" />
          {t("bookDemo.comingSoon.footerNote")}
        </p>
      </motion.div>
    </div>
  );
}
