"use client";

import * as React from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./config";

interface I18nProviderProps {
  children: React.ReactNode;
  locale: string;
}

/**
 * Sync i18n language outside of React's render cycle.
 * Called once at module level and then from useEffect on locale change.
 * This avoids the react-hooks/immutability lint rule (no external mutation
 * during render) while still preventing hydration mismatch.
 */
function syncLanguage(locale: string) {
  if (i18n.language !== locale) {
    i18n.language = locale;
    i18n.languages = [locale, ...(i18n.options.fallbackLng as string[])].filter(
      (v, i, a) => a.indexOf(v) === i
    );
  }
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  // Sync on mount and when locale changes (client-side navigation).
  // The i18n instance is already initialised with defaultLocale, so SSR
  // renders translated text on the first pass.
  React.useEffect(() => {
    syncLanguage(locale);
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
