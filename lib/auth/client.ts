"use client";

/**
 * Better Auth -- Client Wrappers
 *
 * Centralized auth hooks for all client-side code.
 * Every client component imports from here -- never from better-auth/react directly.
 *
 * Pattern #4319: When ServerAuthProvider is in the tree (app layout),
 * hooks return server-fetched data immediately while Better Auth hooks
 * are still pending. Once Better Auth resolves, its live data takes over.
 * This eliminates 3 HTTP round-trips per page navigation.
 *
 * @module lib/auth/client
 */

import { authClient } from "@/lib/auth-client";
import { useServerAuth } from "@/components/providers/server-auth-provider";

// -- Helper: format raw user into the shape consumers expect ----------------

function formatUser(raw: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}) {
  const nameParts = raw.name?.split(" ") ?? [];
  const firstName = nameParts[0] ?? null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  return {
    id: raw.id,
    firstName,
    lastName,
    fullName: raw.name,
    primaryEmailAddress: raw.email ? { emailAddress: raw.email } : null,
    imageUrl: raw.image ?? "",
    email: raw.email,
  };
}

// -- useUser ------------------------------------------------------------------

/**
 * Get the current user with profile details.
 *
 * Returns server-fetched data instantly when available (pattern #4319),
 * then switches to live Better Auth data once the hook resolves.
 */
export function useUser() {
  const serverAuth = useServerAuth();
  const session = authClient.useSession();

  // Pattern #4319: if hook is pending but server data exists, use server data
  if (session.isPending && serverAuth) {
    return {
      user: formatUser(serverAuth.user),
      isLoaded: true,
      isSignedIn: true,
    };
  }

  const user = session.data?.user ?? null;

  return {
    user: user ? formatUser(user) : null,
    isLoaded: !session.isPending,
    isSignedIn: !!user,
  };
}

// -- useAuth ------------------------------------------------------------------

/**
 * Get auth state (userId, orgId, orgRole, signOut).
 *
 * Returns server-fetched data instantly when available (pattern #4319).
 */
export function useAuth() {
  const serverAuth = useServerAuth();
  const session = authClient.useSession();
  const activeMember = authClient.useActiveMember();

  // Pattern #4319: server data while hooks are pending
  if (session.isPending && serverAuth) {
    return {
      userId: serverAuth.userId,
      orgId: serverAuth.orgId,
      orgRole: serverAuth.orgRole,
      isLoaded: true,
      isSignedIn: true,
      signOut: authClient.signOut,
    };
  }

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
 * Returns server-fetched data instantly when available (pattern #4319).
 * useHasPermission.ts reads `membership.role`.
 */
export function useActiveOrganization() {
  const serverAuth = useServerAuth();
  const activeOrg = authClient.useActiveOrganization();
  const activeMember = authClient.useActiveMember();

  // Pattern #4319: server data while hooks are pending
  if (activeOrg.isPending && serverAuth?.organization) {
    return {
      organization: serverAuth.organization,
      membership: serverAuth.orgRole
        ? { role: serverAuth.orgRole, id: serverAuth.userId }
        : undefined,
      isLoaded: true,
    };
  }

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
 * Not covered by server hydration (only used in auth pages).
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
 */
export function useSignOut() {
  return {
    signOut: authClient.signOut,
  };
}
