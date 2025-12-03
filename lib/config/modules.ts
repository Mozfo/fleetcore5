/**
 * FleetCore Module Configuration
 *
 * Defines all modules available in the sidebar navigation.
 * Each module has:
 * - Unique key matching ModuleKey type
 * - Icon from lucide-react
 * - Route path
 * - i18n translation key
 * - Required permission to view
 * - Optional sub-navigation items
 */

import {
  LayoutDashboard,
  Users,
  Car,
  UserCircle,
  Wrench,
  BarChart3,
  Settings,
  Shield,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey, Permission } from "./permissions";

export interface SubNavItem {
  key: string;
  labelKey: string; // i18n key
  href: string;
  permission?: Permission;
}

export interface ModuleConfig {
  key: ModuleKey;
  icon: LucideIcon;
  labelKey: string; // i18n key: "modules.{key}"
  href: string;
  permission: Permission; // Required to see in sidebar
  subNav?: SubNavItem[];
  badge?: "new" | "beta"; // Optional badge
}

/**
 * Module definitions for sidebar navigation
 *
 * Order matters - this is the display order in the sidebar
 */
export const MODULES: ModuleConfig[] = [
  {
    key: "dashboard",
    icon: LayoutDashboard,
    labelKey: "modules.dashboard",
    href: "/dashboard",
    permission: "dashboard:view",
  },
  {
    key: "crm",
    icon: Users,
    labelKey: "modules.crm",
    href: "/crm/leads",
    permission: "crm:view",
    subNav: [
      {
        key: "leads_pipeline",
        labelKey: "modules.crm_leads_pipeline",
        href: "/crm/leads",
        permission: "crm:view",
      },
      {
        key: "opportunities",
        labelKey: "modules.crm_opportunities",
        href: "/crm/opportunities",
        permission: "crm:view",
      },
      {
        key: "browser",
        labelKey: "modules.crm_browser",
        href: "/crm/leads/browser",
        permission: "crm:view",
      },
      {
        key: "reports",
        labelKey: "modules.crm_reports",
        href: "/crm/leads/reports",
        permission: "crm:view",
      },
    ],
  },
  {
    key: "fleet",
    icon: Car,
    labelKey: "modules.fleet",
    href: "/fleet/vehicles",
    permission: "fleet:view",
    subNav: [
      {
        key: "vehicles",
        labelKey: "modules.fleet_vehicles",
        href: "/fleet/vehicles",
        permission: "fleet:view",
      },
      {
        key: "assignments",
        labelKey: "modules.fleet_assignments",
        href: "/fleet/assignments",
        permission: "fleet:view",
      },
      {
        key: "documents",
        labelKey: "modules.fleet_documents",
        href: "/fleet/documents",
        permission: "fleet:view",
      },
    ],
  },
  {
    key: "drivers",
    icon: UserCircle,
    labelKey: "modules.drivers",
    href: "/drivers",
    permission: "drivers:view",
    subNav: [
      {
        key: "list",
        labelKey: "modules.drivers_list",
        href: "/drivers",
        permission: "drivers:view",
      },
      {
        key: "onboarding",
        labelKey: "modules.drivers_onboarding",
        href: "/drivers/onboarding",
        permission: "drivers:create",
      },
    ],
  },
  {
    key: "maintenance",
    icon: Wrench,
    labelKey: "modules.maintenance",
    href: "/maintenance",
    permission: "maintenance:view",
    subNav: [
      {
        key: "scheduled",
        labelKey: "modules.maintenance_scheduled",
        href: "/maintenance/scheduled",
        permission: "maintenance:view",
      },
      {
        key: "history",
        labelKey: "modules.maintenance_history",
        href: "/maintenance/history",
        permission: "maintenance:view",
      },
    ],
  },
  {
    key: "analytics",
    icon: BarChart3,
    labelKey: "modules.analytics",
    href: "/analytics",
    permission: "analytics:view",
    badge: "new",
  },
  {
    key: "settings",
    icon: Settings,
    labelKey: "modules.settings",
    href: "/settings",
    permission: "settings:view",
    subNav: [
      {
        key: "settings_crm",
        labelKey: "modules.settings_crm",
        href: "/settings/crm",
        permission: "settings:view",
      },
    ],
  },
  {
    key: "admin",
    icon: Shield,
    labelKey: "modules.admin",
    href: "/admin",
    permission: "admin:view",
    subNav: [
      {
        key: "users",
        labelKey: "modules.admin_users",
        href: "/admin/users",
        permission: "admin:view",
      },
      {
        key: "roles",
        labelKey: "modules.admin_roles",
        href: "/admin/roles",
        permission: "admin:view",
      },
      {
        key: "audit",
        labelKey: "modules.admin_audit",
        href: "/admin/audit",
        permission: "admin:view",
      },
      {
        key: "notifications",
        labelKey: "modules.admin_notifications",
        href: "/admin/notifications",
        permission: "admin:view",
      },
    ],
  },
];

/**
 * Get module config by key
 */
export function getModuleByKey(key: ModuleKey): ModuleConfig | undefined {
  return MODULES.find((m) => m.key === key);
}

/**
 * Get module by current pathname
 * Matches the most specific module based on href
 */
export function getModuleByPath(pathname: string): ModuleConfig | undefined {
  // Remove locale prefix (e.g., /en/crm/leads -> /crm/leads)
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");

  // Find best match (longest matching href)
  let bestMatch: ModuleConfig | undefined;
  let bestMatchLength = 0;

  for (const mod of MODULES) {
    if (
      pathWithoutLocale.startsWith(mod.href) &&
      mod.href.length > bestMatchLength
    ) {
      bestMatch = mod;
      bestMatchLength = mod.href.length;
    }

    // Also check subNav items
    if (mod.subNav) {
      for (const sub of mod.subNav) {
        if (
          pathWithoutLocale.startsWith(sub.href) &&
          sub.href.length > bestMatchLength
        ) {
          bestMatch = mod;
          bestMatchLength = sub.href.length;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Check if a path is within a specific module
 */
export function isPathInModule(
  pathname: string,
  moduleKey: ModuleKey
): boolean {
  const matchedModule = getModuleByPath(pathname);
  return matchedModule?.key === moduleKey;
}
