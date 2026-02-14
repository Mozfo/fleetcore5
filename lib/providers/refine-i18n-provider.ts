"use client";

import type { I18nProvider } from "@refinedev/core";
import i18n from "@/lib/i18n/config";

/**
 * Refine I18nProvider that delegates to the existing i18next singleton.
 *
 * No duplication — Refine's useTranslate() and locale switching both go
 * through the same i18next instance that the rest of FleetCore already uses.
 */
export const fleetcoreI18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) =>
    i18n.t(key, { ...options, defaultValue: defaultMessage }) as string,
  changeLocale: (locale) => i18n.changeLanguage(locale),
  getLocale: () => i18n.language,
};
