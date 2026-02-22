"use client";

/**
 * Better Auth -- Client Wrappers
 *
 * Centralized auth hooks for all client-side code.
 * Replaces direct Clerk imports (@clerk/nextjs).
 *
 * Every client component imports from here -- never from @clerk/* or better-auth/react.
 *
 * @module lib/auth/client
 */

import { authClient } from "@/lib/auth-client";

// -- useUser ------------------------------------------------------------------

/**
 * Get the current user.
 *
 * Replaces: `useUser()` from @clerk/nextjs (5 occurrences).
 * Returns Clerk-compatible shape for minimal downstream changes.
 *
 * Clerk shape preserved:
 * - `user.fullName` (from Better Auth `user.name`)
 * - `user.primaryEmailAddress.emailAddress` (from `user.email`)
 * - `user.imageUrl` (from `user.image`)
 */
export function useUser() {
  const session = authClient.useSession();
  const user = session.data?.user ?? null;

  // Split name into first/last for Clerk-compatible shape
  const nameParts = user?.name?.split(" ") ?? [];
  const firstName = nameParts[0] ?? null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  return {
    user: user
      ? {
          id: user.id,
          firstName,
          lastName,
          fullName: user.name,
          primaryEmailAddress: user.email ? { emailAddress: user.email } : null,
          imageUrl: user.image ?? "",
          email: user.email,
        }
      : null,
    isLoaded: !session.isPending,
    isSignedIn: !!user,
  };
}

// -- useAuth ------------------------------------------------------------------

/**
 * Get auth state (userId, orgId, orgRole, signOut).
 *
 * Replaces: `useAuth()` from @clerk/nextjs (2 occurrences).
 */
export function useAuth() {
  const session = authClient.useSession();
  const activeMember = authClient.useActiveMember();

  return {
    userId: session.data?.user?.id ?? null,
    orgId: session.data?.session?.activeOrganizationId ?? null,
    orgRole: (activeMember.data?.role as string) ?? null,
    isLoaded: !session.isPending,
    isSignedIn: !!session.data?.user,
    signOut: authClient.signOut,
  };
}

// -- useActiveOrganization ----------------------------------------------------

/**
 * Get the active organization and current user's membership.
 *
 * Replaces: `useOrganization()` from @clerk/nextjs (2 occurrences).
 * Returns { organization, membership, isLoaded } for compatibility
 * with useHasPermission.ts which reads `membership.role`.
 */
export function useActiveOrganization() {
  const activeOrg = authClient.useActiveOrganization();
  const activeMember = authClient.useActiveMember();

  return {
    organization: activeOrg.data
      ? {
          id: activeOrg.data.id,
          name: activeOrg.data.name,
          slug: activeOrg.data.slug,
          logo: activeOrg.data.logo ?? null,
        }
      : null,
    membership: activeMember.data
      ? {
          role: activeMember.data.role,
          id: activeMember.data.id,
        }
      : undefined,
    isLoaded: !activeOrg.isPending,
  };
}

// -- useListOrganizations -----------------------------------------------------

/**
 * List organizations the current user belongs to.
 *
 * Replaces: `useOrganizationList()` from @clerk/nextjs (2 occurrences).
 * Clerk returns { organizationList: [{ organization }], setActive }.
 */
export function useListOrganizations() {
  const orgs = authClient.useListOrganizations();

  return {
    organizationList: (orgs.data ?? []).map((org) => ({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
    })),
    isLoaded: !orgs.isPending,
    setActive: authClient.organization.setActive,
  };
}

// -- useSignOut ---------------------------------------------------------------

/**
 * Simple sign-out hook.
 *
 * Replaces: direct signOut calls from Clerk.
 */
export function useSignOut() {
  return {
    signOut: authClient.signOut,
  };
}
