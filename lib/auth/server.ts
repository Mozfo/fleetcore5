/**
 * Better Auth -- Server Wrappers
 *
 * Centralized auth functions for all server-side code.
 * Replaces direct Clerk imports (@clerk/nextjs/server).
 *
 * Every server action, API route, and server component
 * imports from here -- never directly from @clerk/* or better-auth.
 *
 * @module lib/auth/server
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// -- Types --------------------------------------------------------------------

export interface AuthSession {
  /** Better Auth user ID (UUID) */
  userId: string;
  /** Active organization ID or null */
  orgId: string | null;
  /** User's role in the active organization (from auth_member) */
  orgRole: string | null;
  /** User profile data */
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
  };
}

/** Narrowed session for CRM — orgId guaranteed non-null */
export interface CrmAuthSession extends AuthSession {
  orgId: string;
}

export interface ProviderContext {
  /** Provider UUID or null for global access */
  providerId: string | null;
  /** Employee UUID */
  employeeId: string | null;
  /** Whether user has global access (CEO/admin) */
  isGlobalAccess: boolean;
}

// -- Session ------------------------------------------------------------------

/**
 * Get the current authenticated session.
 *
 * Replaces: `const { userId, orgId } = await auth()` from Clerk.
 * Returns null if not authenticated (no throw).
 */
export async function getSession(): Promise<AuthSession | null> {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result) return null;

  const { user, session } = result;
  const orgId = session.activeOrganizationId ?? null;

  // Fetch org role from auth_member if user has an active organization
  let orgRole: string | null = null;
  if (orgId) {
    const member = await prisma.auth_member.findFirst({
      where: {
        user_id: user.id,
        organization_id: orgId,
      },
      select: { role: true },
    });
    orgRole = member?.role ?? null;
  }

  return {
    userId: user.id,
    orgId,
    orgRole,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
    },
  };
}

// -- Auth Guards --------------------------------------------------------------

/**
 * Require an authenticated session. Throws if not logged in.
 *
 * Replaces: `const { userId } = await auth(); if (!userId) throw ...`
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("AUTH: Not authenticated");
  }
  return session;
}

/**
 * Require CRM admin access (headquarters organization).
 *
 * Replaces: `auth()` + `ADMIN_ORG_ID` env var check (14 files, ~30 guards).
 * Uses DB-driven check: auth_organization.metadata -> {"is_headquarters": true}
 *
 * Throws if:
 * - Not authenticated
 * - No active organization
 * - Active organization is not headquarters
 */
export async function requireCrmAuth(): Promise<CrmAuthSession> {
  const session = await requireAuth();

  if (!session.orgId) {
    throw new Error("AUTH: No active organization");
  }

  // DB-driven HQ check -- replaces FLEETCORE_ADMIN_ORG_ID env var
  const org = await prisma.auth_organization.findUnique({
    where: { id: session.orgId },
    select: { metadata: true },
  });

  if (!org) {
    throw new Error("AUTH: Organization not found");
  }

  // metadata is a String? field -- parse as JSON
  let isHq = false;
  if (org.metadata) {
    try {
      const meta = JSON.parse(org.metadata) as Record<string, unknown>;
      isHq = meta?.is_headquarters === true;
    } catch {
      // Invalid JSON in metadata -- not HQ
    }
  }

  if (!isHq) {
    throw new Error("AUTH: Not a headquarters organization");
  }

  // Safe assertion: orgId verified non-null above (line 124 throws if null)
  return session as CrmAuthSession;
}

// -- User Info ----------------------------------------------------------------

/**
 * Get the current user (without requiring auth).
 *
 * Replaces: `currentUser()` from Clerk (5 occurrences).
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

// -- Provider Context ---------------------------------------------------------

/**
 * Get provider context for the current user.
 *
 * Looks up the authenticated user in adm_provider_employees
 * using auth_user_id (Better Auth) with fallback to clerk_user_id (transition).
 *
 * Replaces: getProviderContext() from lib/utils/provider-context.ts
 */
export async function getProviderContext(): Promise<ProviderContext> {
  const session = await getSession();

  if (!session) {
    return {
      providerId: null,
      employeeId: null,
      isGlobalAccess: false,
    };
  }

  const employee = await prisma.adm_provider_employees.findFirst({
    where: {
      OR: [{ auth_user_id: session.userId }, { clerk_user_id: session.userId }],
      status: "active",
      deleted_at: null,
    },
    select: {
      id: true,
      provider_id: true,
    },
  });

  if (!employee) {
    return {
      providerId: null,
      employeeId: null,
      isGlobalAccess: false,
    };
  }

  return {
    providerId: employee.provider_id,
    employeeId: employee.id,
    isGlobalAccess: employee.provider_id === null,
  };
}
