"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { Bell, PanelLeftIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useUser();
  const { t } = useTranslation("common");

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        {/* Sidebar toggle */}
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          <PanelLeftIcon />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        {/* Search */}
        <div className="hidden md:block">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("navigation.search", "Search...")}
              className="border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring h-9 w-64 rounded-md border pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-foreground text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-muted-foreground text-xs">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
