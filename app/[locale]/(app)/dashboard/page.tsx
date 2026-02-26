"use client";

import { useUser } from "@/lib/auth/client";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

const DashboardGrid = dynamic(
  () =>
    import("@/components/app/widgets/DashboardGrid").then(
      (mod) => mod.DashboardGrid
    ),
  { ssr: false }
);
import { FCPageHeader } from "@/components/fc";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslation("common");

  const displayName = isLoaded && user?.firstName ? user.firstName : null;

  const titleText = displayName
    ? `${t("dashboard_page.welcome")}, ${displayName}`
    : isLoaded
      ? t("dashboard_page.welcome")
      : t("dashboard_page.welcome");

  return (
    <div className="bg-fc-bg-app flex h-full flex-col">
      <FCPageHeader
        title={titleText}
        subtitle={t("dashboard_page.subtitle")}
        badge={
          !isLoaded ? (
            <Loader2 className="text-fc-text-muted h-4 w-4 animate-spin" />
          ) : undefined
        }
      />
      <div className="flex-1 overflow-auto p-4">
        <DashboardGrid />
      </div>
    </div>
  );
}
