"use client";

import * as React from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useHasPermission } from "@/lib/hooks/useHasPermission";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { useCrmFeatureFlags } from "@/lib/hooks/useCrmFeatureFlags";
import { hasPermission as checkPermission } from "@/lib/config/permissions";
import { useIsTablet } from "@/hooks/use-mobile";
import type { ModuleConfig, SubNavItem } from "@/lib/config/modules";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useActiveCheck() {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");

  const isModuleActive = React.useCallback(
    (mod: ModuleConfig): boolean => {
      if (pathWithoutLocale.startsWith(mod.href)) return true;
      if (mod.subNav) {
        for (const sub of mod.subNav) {
          if (pathWithoutLocale.startsWith(sub.href)) return true;
        }
      }
      return false;
    },
    [pathWithoutLocale]
  );

  const isSubNavActive = React.useCallback(
    (sub: SubNavItem): boolean => pathWithoutLocale === sub.href,
    [pathWithoutLocale]
  );

  return { isModuleActive, isSubNavActive };
}

/** Group modules by their `group` field, preserving order. */
function groupModules(
  modules: ModuleConfig[]
): { group: string | undefined; items: ModuleConfig[] }[] {
  const groups: { group: string | undefined; items: ModuleConfig[] }[] = [];
  let current: (typeof groups)[number] | null = null;

  for (const mod of modules) {
    if (!current || mod.group !== current.group) {
      current = { group: mod.group, items: [] };
      groups.push(current);
    }
    current.items.push(mod);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const { localizedPath } = useLocalizedPath();
  const { accessibleModules, orgRole } = useHasPermission();
  const { opportunitiesEnabled, quotesEnabled } = useCrmFeatureFlags();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const isTablet = useIsTablet();
  const { isModuleActive, isSubNavActive } = useActiveCheck();

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  // Auto-collapse on tablet
  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet, setOpen]);

  // Filter sub-nav items (permissions + feature flags)
  const filterSubNav = React.useCallback(
    (mod: ModuleConfig, sub: SubNavItem): boolean => {
      if (sub.permission && !checkPermission(orgRole, sub.permission))
        return false;
      if (
        mod.key === "crm" &&
        sub.key === "opportunities" &&
        !opportunitiesEnabled
      )
        return false;
      if (mod.key === "crm" && sub.key === "quotes" && !quotesEnabled)
        return false;
      return true;
    },
    [orgRole, opportunitiesEnabled, quotesEnabled]
  );

  const groups = React.useMemo(
    () => groupModules(accessibleModules),
    [accessibleModules]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ---- Header: Logo ---- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent/50"
              asChild
            >
              <Link href={localizedPath("dashboard")}>
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-700">
                  <span className="text-sm font-bold text-white">F</span>
                </div>
                <span className="text-foreground font-semibold">FleetCore</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ---- Content: Navigation ---- */}
      <SidebarContent>
        {groups.map((grp, gi) => (
          <SidebarGroup key={gi}>
            {grp.group && <SidebarGroupLabel>{grp.group}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {grp.items.map((mod) => {
                  const Icon = mod.icon;
                  const active = isModuleActive(mod);
                  const visibleSubs = mod.subNav?.filter((s) =>
                    filterSubNav(mod, s)
                  );
                  const hasSubs = visibleSubs && visibleSubs.length > 0;

                  if (hasSubs) {
                    return (
                      <SidebarMenuItem key={mod.key}>
                        {/* Icon-collapsed: DropdownMenu */}
                        <div className="hidden group-data-[collapsible=icon]:block">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton tooltip={t(mod.labelKey)}>
                                <Icon />
                                <span>{t(mod.labelKey)}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side={isMobile ? "bottom" : "right"}
                              align={isMobile ? "end" : "start"}
                              className="min-w-48 rounded-lg"
                            >
                              <DropdownMenuLabel>
                                {t(mod.labelKey)}
                              </DropdownMenuLabel>
                              {visibleSubs.map((sub) => (
                                <DropdownMenuItem key={sub.key} asChild>
                                  <Link href={localizedPath(sub.href.slice(1))}>
                                    {t(sub.labelKey)}
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Expanded: Collapsible */}
                        <Collapsible
                          className="block group-data-[collapsible=icon]:hidden"
                          defaultOpen={active}
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={t(mod.labelKey)}>
                              <Icon />
                              <span>{t(mod.labelKey)}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {visibleSubs.map((sub) => (
                                <SidebarMenuSubItem key={sub.key}>
                                  <SidebarMenuSubButton
                                    isActive={isSubNavActive(sub)}
                                    asChild
                                  >
                                    <Link
                                      href={localizedPath(sub.href.slice(1))}
                                    >
                                      <span>{t(sub.labelKey)}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  }

                  // No sub-nav
                  return (
                    <SidebarMenuItem key={mod.key}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={t(mod.labelKey)}
                        asChild
                      >
                        <Link href={localizedPath(mod.href.slice(1))}>
                          <Icon />
                          <span>{t(mod.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                      {mod.badge && (
                        <SidebarMenuBadge
                          className={cn(
                            "border text-xs",
                            mod.badge === "new"
                              ? "border-green-400 text-green-600"
                              : "border-purple-400 text-purple-600"
                          )}
                        >
                          {mod.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ---- Footer ---- */}
      <SidebarFooter>
        <div className="text-muted-foreground px-2 py-1 text-xs group-data-[collapsible=icon]:hidden">
          FleetCore v1.0
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
