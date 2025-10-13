import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { locales, defaultLocale } from "./locales";

export { locales, defaultLocale, type Locale } from "./locales";

// Import des fichiers de traduction de manière dynamique
// Use void to explicitly mark as fire-and-forget initialization
void i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`@/lib/i18n/locales/${language}/${namespace}.json`)
    )
  )
  .init({
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    defaultNS: "common",
    ns: ["common", "auth", "public", "admin"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
