"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { PanelLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import Breadcrumbs from "@/components/layout/header/breadcrumbs";
import Search from "@/components/layout/header/search";
import Notifications from "@/components/layout/header/notifications";
import ThemeSwitch from "@/components/layout/header/theme-switch";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useUser();

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          <PanelLeftIcon />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumbs />
        <Search />

        <div className="ml-auto flex items-center gap-2">
          <Notifications />
          <ThemeSwitch />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          {/* User — Clerk replaces shadcnuikit UserMenu */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right lg:block">
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
