/**
 * System Constants
 * Well-known UUIDs for system-level entities
 */

/**
 * System User ID - Used for automated operations and system-generated records
 * This user exists in the 'System' tenant and is used for audit trail
 * on operations that don't have a human user (e.g., automated notifications)
 *
 * Reference: adm_members.id = '00000000-0000-0000-0000-000000000001'
 */
export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * System Provider Employee ID - Used for tenant lifecycle events performed by automated system
 *
 * Reference: adm_members.id = '00000000-0000-0000-0000-000000000002'
 */
export const SYSTEM_PROVIDER_EMPLOYEE_ID =
  "00000000-0000-0000-0000-000000000002";

/**
 * System Tenant ID - Reserved tenant for system-level operations
 *
 * Reference: adm_tenants.id = '00000000-0000-0000-0000-000000000000'
 */
export const SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000000";
