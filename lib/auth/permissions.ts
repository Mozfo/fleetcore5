import { prisma } from "@/lib/prisma";

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
 * @param userId - Clerk user ID (from x-user-id header)
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
    // 1. Get member by clerk_user_id
    const member = await prisma.adm_members.findFirst({
      where: {
        clerk_user_id: userId,
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
            name: true,
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

      roleNames.push(role.name);

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
 * @param userId - Clerk user ID
 * @returns True if user is provider employee
 */
export async function isProviderEmployee(userId: string): Promise<boolean> {
  try {
    const employee = await prisma.adm_provider_employees.findFirst({
      where: {
        clerk_user_id: userId,
        status: "active",
        deleted_at: null,
      },
    });

    return !!employee;
  } catch (_error) {
    return false;
  }
}
