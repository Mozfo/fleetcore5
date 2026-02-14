"use client";

import type { AccessControlProvider } from "@refinedev/core";
import { hasPermission, type OrgRole } from "@/lib/config/permissions";
import {
  RESOURCE_TO_MODULE,
  ACTION_TO_PERMISSION,
} from "@/lib/config/refine-mappings";

/**
 * Factory that creates a Refine AccessControlProvider.
 *
 * Receives a getter function for the current OrgRole (from Clerk).
 * Uses FleetCore's existing hasPermission() — no duplication.
 */
export function createAccessControlProvider(
  getRole: () => OrgRole | null | undefined
): AccessControlProvider {
  return {
    can: async ({ resource, action }) => {
      const role = getRole();
      const mod = resource ? RESOURCE_TO_MODULE[resource] : undefined;
      const permAction = action ? ACTION_TO_PERMISSION[action] : undefined;

      // Unknown resource or action → deny
      if (!mod || !permAction) {
        return { can: false, reason: "Unknown resource or action" };
      }

      const allowed = hasPermission(role, `${mod}:${permAction}`);
      return allowed
        ? { can: true }
        : { can: false, reason: "Insufficient permissions" };
    },
  };
}
