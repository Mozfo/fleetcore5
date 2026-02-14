import type { ModuleKey, PermissionAction } from "@/lib/config/permissions";

/**
 * Mapping from Refine resource names to FleetCore module keys.
 * All CRM resources map to the "crm" module.
 *
 * Shared by: refine-access-control-provider.ts, app/api/auth/can/route.ts
 */
export const RESOURCE_TO_MODULE: Record<string, ModuleKey> = {
  leads: "crm",
  opportunities: "crm",
  quotes: "crm",
  orders: "crm",
  agreements: "crm",
  activities: "crm",
  vehicles: "fleet",
  drivers: "drivers",
  maintenance: "maintenance",
  dashboard: "dashboard",
  analytics: "analytics",
  settings: "settings",
  admin: "admin",
};

/**
 * Mapping from Refine action names to FleetCore permission actions.
 * Refine uses "list"/"show" for read operations → FleetCore "view".
 *
 * Shared by: refine-access-control-provider.ts, app/api/auth/can/route.ts
 */
export const ACTION_TO_PERMISSION: Record<string, PermissionAction> = {
  list: "view",
  show: "view",
  create: "create",
  edit: "edit",
  delete: "delete",
  export: "export",
};
