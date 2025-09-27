import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// Import des fichiers de traduction de manière dynamique
i18n
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
    ns: ["common", "auth", "public"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
