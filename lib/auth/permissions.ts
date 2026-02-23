import { prisma } from "@/lib/prisma";
import { getTranslation } from "@/lib/utils/i18n-db";

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  isGlobalAdmin: boolean;
  memberId: string | null;
  roles: string[];
}

/**
 * Check if user has specific permission
 * Queries adm_member_roles -> adm_roles -> checks permissions JSONB field
 *
 * @param userId - Auth user ID (from x-user-id header)
 * @param tenantId - Tenant ID (from x-tenant-id header)
 * @param requiredPermission - Permission to check (e.g., 'manage_directory', 'admin')
 * @returns Permission check result with hasPermission flag and isGlobalAdmin flag
 */
export async function hasPermission(
  userId: string,
  tenantId: string,
  requiredPermission: string
): Promise<PermissionCheckResult> {
  try {
    // 1. Get member by auth_user_id
    const member = await prisma.clt_members.findFirst({
      where: {
        auth_user_id: userId,
        tenant_id: tenantId,
        deleted_at: null,
        status: "active",
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      return {
        hasPermission: false,
        isGlobalAdmin: false,
        memberId: null,
        roles: [],
      };
    }

    // 2. Get member roles with permissions
    const memberRoles = await prisma.adm_member_roles.findMany({
      where: {
        member_id: member.id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        adm_roles: {
          select: {
            slug: true,
            name_translations: true,
            permissions: true,
            deleted_at: true,
            status: true,
          },
        },
      },
    });

    if (memberRoles.length === 0) {
      return {
        hasPermission: false,
        isGlobalAdmin: false,
        memberId: member.id,
        roles: [],
      };
    }

    // 3. Check permissions in roles (filter out deleted/inactive roles)
    let hasRequiredPermission = false;
    let isGlobalAdmin = false;
    const roleNames: string[] = [];

    for (const memberRole of memberRoles) {
      const role = memberRole.adm_roles;

      // Skip deleted or inactive roles
      if (role.deleted_at !== null || role.status !== "active") {
        continue;
      }

      // Use English name from translations for logging, fallback to slug
      const roleName = getTranslation(
        role.name_translations as Record<string, string> | null,
        "en",
        role.slug
      );
      roleNames.push(roleName);

      // Check if role has required permission
      const permissions = role.permissions as Record<string, boolean>;

      // Admin permission grants all permissions
      if (permissions["admin"] === true) {
        hasRequiredPermission = true;
        isGlobalAdmin = true;
        break;
      }

      // Check specific permission
      if (permissions[requiredPermission] === true) {
        hasRequiredPermission = true;
      }
    }

    return {
      hasPermission: hasRequiredPermission,
      isGlobalAdmin,
      memberId: member.id,
      roles: roleNames,
    };
  } catch (_error) {
    return {
      hasPermission: false,
      isGlobalAdmin: false,
      memberId: null,
      roles: [],
    };
  }
}

/**
 * Check if user is a provider employee (FleetCore internal user)
 * Provider employees have access to global data (tenant_id = NULL)
 *
 * @param userId - Auth user ID
 * @returns True if user is provider employee
 */
export async function isProviderEmployee(userId: string): Promise<boolean> {
  try {
    const member = await prisma.clt_members.findFirst({
      where: {
        auth_user_id: userId,
        status: "active",
        deleted_at: null,
      },
    });

    return !!member;
  } catch (_error) {
    return false;
  }
}
