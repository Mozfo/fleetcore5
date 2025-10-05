import { notFound } from "next/navigation";
import { Providers } from "./providers";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { locales, type Locale } from "@/lib/i18n/locales";

// Pour le static rendering (optimisation)
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return {
    title:
      locale === "fr"
        ? "FleetCore - Gestion de Flotte"
        : "FleetCore - Fleet Management",
    description:
      locale === "fr"
        ? "Solution complète de gestion de flotte"
        : "Complete fleet management solution",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 1. Récupérer le locale (Next.js 15 async params)
  const { locale } = await params;

  // 2. Valider que le locale existe
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // 3. Wrapper avec I18nProvider pour react-i18next
  return (
    <I18nProvider locale={locale}>
      <Providers>{children}</Providers>
    </I18nProvider>
  );
}
