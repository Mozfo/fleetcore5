"use client";

import { useTranslation } from "react-i18next";

export default function TestPage() {
  const { t } = useTranslation("common");

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">{t("test.title")}</h1>
      <p>{t("test.message")}</p>
      <p className="mt-4">Welcome: {t("welcome")}</p>
    </div>
  );
}
