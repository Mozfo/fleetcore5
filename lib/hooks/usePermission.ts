/**
 * usePermission — Client-side permission hook.
 *
 * Keys: "{module}.{action}" — e.g. "lead.delete", "driver.edit",
 * "fleet.assign", "contract.cancel"
 *
 * Phase 1: hardcoded. Phase 2: integrate auth org roles.
 */

const DENIED = new Set<string>(["lead.delete"]);

export function usePermission() {
  const can = (permission: string): boolean => !DENIED.has(permission);
  return { can };
}
