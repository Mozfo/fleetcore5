"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { DashboardGrid } from "@/components/app/widgets";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { t } = useTranslation("common");

  // Wait for Clerk to load user data
  const displayName = isLoaded && user?.firstName ? user.firstName : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("dashboard_page.welcome")}
          {displayName ? (
            `, ${displayName}`
          ) : isLoaded ? (
            ""
          ) : (
            <span className="ml-2 inline-flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </span>
          )}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("dashboard_page.subtitle")}
        </p>
      </div>

      {/* Dashboard Grid */}
      <DashboardGrid />
    </div>
  );
}
