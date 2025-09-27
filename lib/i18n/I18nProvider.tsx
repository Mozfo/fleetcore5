"use client";

import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./config";

interface I18nProviderProps {
  children: React.ReactNode;
  locale: string;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initI18n = async () => {
      if (i18n.language !== locale) {
        await i18n.changeLanguage(locale);
      }
      setIsLoading(false);
    };

    initI18n();
  }, [locale]);

  if (isLoading) {
    return null; // ou un loading spinner
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
