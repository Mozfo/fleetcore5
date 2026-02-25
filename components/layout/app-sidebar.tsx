"use client";

import * as React from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

import { useHasPermission } from "@/lib/hooks/useHasPermission";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { useCrmFeatureFlags } from "@/lib/hooks/useCrmFeatureFlags";
import { hasPermission as checkPermission } from "@/lib/config/permissions";
import { useIsTablet } from "@/hooks/use-mobile";
import type { ModuleConfig, SubNavItem } from "@/lib/config/modules";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
import { ScrollArea } from "@/components/ui/scroll-area";

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
              className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0! hover:bg-[var(--primary)]/5"
              asChild
            >
              <Link href={localizedPath("dashboard")}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-700">
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
        <ScrollArea className="h-full">
          {groups.map((grp, gi) => (
            <SidebarGroup key={gi}>
              {grp.group && <SidebarGroupLabel>{grp.group}</SidebarGroupLabel>}
              <SidebarGroupContent className="flex flex-col gap-2">
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
                                <SidebarMenuButton
                                  className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                                  tooltip={t(mod.labelKey)}
                                >
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
                                {visibleSubs.map((sub) =>
                                  sub.disabled ? (
                                    <DropdownMenuItem
                                      className="text-muted-foreground cursor-not-allowed opacity-50"
                                      key={sub.key}
                                      disabled
                                    >
                                      {t(sub.labelKey)}
                                      <span className="text-muted-foreground ml-auto text-[10px]">
                                        Coming soon
                                      </span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10! active:bg-[var(--primary)]/10!"
                                      key={sub.key}
                                      asChild
                                    >
                                      <Link
                                        href={localizedPath(sub.href.slice(1))}
                                      >
                                        {t(sub.labelKey)}
                                      </Link>
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Expanded: Collapsible */}
                          <Collapsible
                            className="group/collapsible block group-data-[collapsible=icon]:hidden"
                            defaultOpen={active}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                                tooltip={t(mod.labelKey)}
                              >
                                <Icon />
                                <span>{t(mod.labelKey)}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {visibleSubs.map((sub) => (
                                  <SidebarMenuSubItem key={sub.key}>
                                    {sub.disabled ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <SidebarMenuSubButton className="text-muted-foreground cursor-not-allowed opacity-50">
                                            <span>{t(sub.labelKey)}</span>
                                          </SidebarMenuSubButton>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                          Coming soon
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <SidebarMenuSubButton
                                        className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                                        isActive={isSubNavActive(sub)}
                                        asChild
                                      >
                                        <Link
                                          href={localizedPath(
                                            sub.href.slice(1)
                                          )}
                                        >
                                          <span>{t(sub.labelKey)}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    )}
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
                          className="hover:text-foreground active:text-foreground hover:bg-[var(--primary)]/10 active:bg-[var(--primary)]/10"
                          isActive={active}
                          tooltip={t(mod.labelKey)}
                          asChild
                        >
                          <Link href={localizedPath(mod.href.slice(1))}>
                            <Icon />
                            <span>{t(mod.labelKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                        {mod.badge === "new" && (
                          <SidebarMenuBadge className="border border-green-400 text-green-600 peer-hover/menu-button:text-green-600">
                            New
                          </SidebarMenuBadge>
                        )}
                        {mod.badge === "beta" && (
                          <SidebarMenuBadge className="peer-hover/menu-button:text-foreground opacity-50">
                            Beta
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>

      {/* ---- Footer ---- */}
      <SidebarFooter>
        <div className="text-muted-foreground px-2 py-1 text-center text-xs group-data-[collapsible=icon]:hidden">
          &copy; FleetCore 2026
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
