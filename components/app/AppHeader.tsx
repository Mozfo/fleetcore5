"use client";

import Link from "next/link";
import { useUser } from "@/lib/auth/client";
import { useTranslation } from "react-i18next";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { UserMenu } from "@/components/layout/UserMenu";

interface AppHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

/**
 * AppHeader - FleetCore Design System header (56px)
 *
 * Left: Menu (mobile) + Logo + Search
 * Right: Notifications + User
 */
export function AppHeader({
  onMenuClick,
  showMenuButton = false,
}: AppHeaderProps) {
  const { user } = useUser();
  const { t } = useTranslation("common");
  const { localizedPath } = useLocalizedPath();

  return (
    <header className="border-fc-border-light shadow-fc-sm flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Left: Menu + Logo + Search */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo */}
        <Link
          href={localizedPath("dashboard")}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-700">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-fc-text-primary hidden text-lg font-semibold sm:block dark:text-white">
            FleetCore
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:block">
          <div className="relative">
            <Search className="text-fc-text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("navigation.search", "Search...")}
              className="rounded-fc-md border-fc-border-light bg-fc-bg-hover text-fc-text-primary placeholder:text-fc-text-muted focus:border-fc-primary-500 focus:ring-fc-primary-500 h-9 w-64 border pr-4 pl-10 text-sm focus:ring-1 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="rounded-fc-md hover:bg-fc-bg-hover relative flex h-9 w-9 items-center justify-center transition-colors duration-150 dark:hover:bg-gray-800">
          <Bell className="text-fc-text-secondary h-5 w-5 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User info + avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-fc-text-primary text-sm font-medium dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-fc-text-muted text-xs dark:text-gray-400">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <UserMenu afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
