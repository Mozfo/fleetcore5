"use client";

import { useOrganization } from "@clerk/nextjs";
import { useMemo } from "react";
import {
  hasPermission,
  hasModuleAccess,
  getAccessibleModules,
  getPermissionsForRole,
  type OrgRole,
  type Permission,
  type ModuleKey,
} from "@/lib/config/permissions";
import { MODULES, type ModuleConfig } from "@/lib/config/modules";

/**
 * Hook to check user permissions based on Clerk orgRole
 *
 * Usage:
 * ```tsx
 * const { can, canAccessModule, accessibleModules } = useHasPermission();
 *
 * if (can("crm:edit")) {
 *   // Show edit button
 * }
 *
 * if (canAccessModule("crm")) {
 *   // Show CRM in sidebar
 * }
 * ```
 */
export function useHasPermission() {
  const { membership } = useOrganization();

  // Get orgRole from Clerk membership
  const orgRole = membership?.role as OrgRole | undefined;

  // Memoize permission checks to avoid recalculation
  const permissions = useMemo(() => {
    return getPermissionsForRole(orgRole);
  }, [orgRole]);

  const accessibleModuleKeys = useMemo(() => {
    return getAccessibleModules(orgRole);
  }, [orgRole]);

  // Get full module configs for accessible modules (for sidebar)
  const accessibleModules = useMemo(() => {
    return MODULES.filter((module) => hasModuleAccess(orgRole, module.key));
  }, [orgRole]);

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    return hasPermission(orgRole, permission);
  };

  /**
   * Check if user can access a module (any action)
   */
  const canAccessModule = (moduleKey: ModuleKey): boolean => {
    return hasModuleAccess(orgRole, moduleKey);
  };

  /**
   * Check multiple permissions (AND logic)
   */
  const canAll = (perms: Permission[]): boolean => {
    return perms.every((p) => hasPermission(orgRole, p));
  };

  /**
   * Check multiple permissions (OR logic)
   */
  const canAny = (perms: Permission[]): boolean => {
    return perms.some((p) => hasPermission(orgRole, p));
  };

  return {
    // Current role
    orgRole,

    // Permission checks
    can,
    canAccessModule,
    canAll,
    canAny,

    // Lists
    permissions,
    accessibleModuleKeys,
    accessibleModules,

    // Loading state
    isLoading: membership === undefined,
  };
}

/**
 * Hook to get filtered modules for sidebar
 * Returns only modules the user can access
 */
export function useAccessibleModules(): ModuleConfig[] {
  const { accessibleModules } = useHasPermission();
  return accessibleModules;
}
