import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { locales, defaultLocale } from "./locales";

// All translation resources loaded synchronously to prevent hydration mismatch.
// With react-i18next + Next.js App Router, async backends (resourcesToBackend)
// cause SSR to render keys while the client renders translated text.
// Inline resources make init() synchronous — t() returns translated text on
// both server and client from the very first render pass.
import commonEn from "@/lib/i18n/locales/en/common.json";
import commonFr from "@/lib/i18n/locales/fr/common.json";
import authEn from "@/lib/i18n/locales/en/auth.json";
import authFr from "@/lib/i18n/locales/fr/auth.json";
import publicEn from "@/lib/i18n/locales/en/public.json";
import publicFr from "@/lib/i18n/locales/fr/public.json";
import adminEn from "@/lib/i18n/locales/en/admin.json";
import adminFr from "@/lib/i18n/locales/fr/admin.json";
import crmEn from "@/lib/i18n/locales/en/crm.json";
import crmFr from "@/lib/i18n/locales/fr/crm.json";

export { locales, defaultLocale, type Locale } from "./locales";

void i18n.use(initReactI18next).init({
  fallbackLng: defaultLocale,
  supportedLngs: locales,
  defaultNS: "common",
  ns: ["common", "auth", "public", "admin", "crm"],
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
      public: publicEn,
      admin: adminEn,
      crm: crmEn,
    },
    fr: {
      common: commonFr,
      auth: authFr,
      public: publicFr,
      admin: adminFr,
      crm: crmFr,
    },
  },
  initImmediate: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
