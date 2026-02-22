/**
 * FleetCore Permission System
 *
 * Architecture:
 * - Permissions are module:action pairs (e.g., "crm:view", "fleet:edit")
 * - Roles are mapped to sets of permissions
 * - orgRole from auth session determines which permissions a user has
 */

// Available actions for each module
export type PermissionAction = "view" | "create" | "edit" | "delete" | "export";

// Available modules in FleetCore
export type ModuleKey =
  | "dashboard"
  | "crm"
  | "fleet"
  | "drivers"
  | "maintenance"
  | "analytics"
  | "settings"
  | "admin";

// Permission string format: "module:action"
export type Permission = `${ModuleKey}:${PermissionAction}`;

// Organization roles
export type OrgRole =
  | "org:admin" // default admin
  | "org:adm_admin" // FleetCore super admin
  | "org:adm_commercial" // FleetCore commercial (CRM access)
  | "org:adm_support" // FleetCore support
  | "org:provider_admin" // Client tenant admin
  | "org:provider_manager" // Client tenant manager
  | "org:provider_user"; // Client tenant user

/**
 * Permission definitions by role
 *
 * FleetCore Admin roles (internal team):
 * - adm_admin: Full access to everything
 * - adm_commercial: CRM + Dashboard
 * - adm_support: Read-only + limited actions
 *
 * Provider roles (client tenants):
 * - provider_admin: Full access to their tenant
 * - provider_manager: Manage fleet + drivers
 * - provider_user: View only
 */
export const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  // FleetCore Admin - Super Admin
  "org:adm_admin": [
    "dashboard:view",
    "dashboard:edit",
    "crm:view",
    "crm:create",
    "crm:edit",
    "crm:delete",
    "crm:export",
    "fleet:view",
    "fleet:create",
    "fleet:edit",
    "fleet:delete",
    "fleet:export",
    "drivers:view",
    "drivers:create",
    "drivers:edit",
    "drivers:delete",
    "drivers:export",
    "maintenance:view",
    "maintenance:create",
    "maintenance:edit",
    "maintenance:delete",
    "analytics:view",
    "analytics:export",
    "settings:view",
    "settings:edit",
    "admin:view",
    "admin:create",
    "admin:edit",
    "admin:delete",
  ],

  // FleetCore Admin - Commercial
  "org:adm_commercial": [
    "dashboard:view",
    "dashboard:edit",
    "crm:view",
    "crm:create",
    "crm:edit",
    "crm:export",
    "analytics:view",
  ],

  // FleetCore Admin - Support
  "org:adm_support": [
    "dashboard:view",
    "crm:view",
    "fleet:view",
    "drivers:view",
    "maintenance:view",
    "analytics:view",
  ],

  // default admin (treat as adm_admin for compatibility)
  "org:admin": [
    "dashboard:view",
    "dashboard:edit",
    "crm:view",
    "crm:create",
    "crm:edit",
    "crm:delete",
    "crm:export",
    "fleet:view",
    "fleet:create",
    "fleet:edit",
    "fleet:delete",
    "fleet:export",
    "drivers:view",
    "drivers:create",
    "drivers:edit",
    "drivers:delete",
    "drivers:export",
    "maintenance:view",
    "maintenance:create",
    "maintenance:edit",
    "maintenance:delete",
    "analytics:view",
    "analytics:export",
    "settings:view",
    "settings:edit",
    "admin:view",
    "admin:create",
    "admin:edit",
    "admin:delete",
  ],

  // Provider - Admin (client tenant)
  "org:provider_admin": [
    "dashboard:view",
    "dashboard:edit",
    "fleet:view",
    "fleet:create",
    "fleet:edit",
    "fleet:delete",
    "fleet:export",
    "drivers:view",
    "drivers:create",
    "drivers:edit",
    "drivers:delete",
    "drivers:export",
    "maintenance:view",
    "maintenance:create",
    "maintenance:edit",
    "maintenance:delete",
    "analytics:view",
    "analytics:export",
    "settings:view",
    "settings:edit",
  ],

  // Provider - Manager
  "org:provider_manager": [
    "dashboard:view",
    "fleet:view",
    "fleet:create",
    "fleet:edit",
    "drivers:view",
    "drivers:create",
    "drivers:edit",
    "maintenance:view",
    "maintenance:create",
    "maintenance:edit",
    "analytics:view",
  ],

  // Provider - User (read-only)
  "org:provider_user": [
    "dashboard:view",
    "fleet:view",
    "drivers:view",
    "maintenance:view",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: OrgRole | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has access to a module (any action)
 */
export function hasModuleAccess(
  role: OrgRole | null | undefined,
  module: ModuleKey
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.some((p) => p.startsWith(`${module}:`));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(
  role: OrgRole | null | undefined
): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get all accessible modules for a role
 */
export function getAccessibleModules(
  role: OrgRole | null | undefined
): ModuleKey[] {
  if (!role) return [];
  const permissions = ROLE_PERMISSIONS[role] || [];
  const modules = new Set<ModuleKey>();

  for (const permission of permissions) {
    const [module] = permission.split(":") as [ModuleKey, PermissionAction];
    modules.add(module);
  }

  return Array.from(modules);
}
