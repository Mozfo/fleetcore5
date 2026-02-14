"use client";

import type { AuthProvider } from "@refinedev/core";

/**
 * Factory that creates a Refine AuthProvider from Clerk runtime values.
 *
 * Why a factory? Clerk hooks (useUser, useAuth, useOrganization) can only be
 * called inside React components. The AuthProvider is a plain object passed to
 * <Refine>. The factory bridges the two: the layout component calls hooks,
 * then passes their values here.
 *
 * This provider is an OBSERVER of Clerk state — it does NOT control login/
 * logout flows. Clerk handles those via <SignIn>, <UserButton>, middleware.
 */
export function createAuthProvider(clerk: {
  userId: string | null | undefined;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
  user: {
    fullName: string | null;
    primaryEmailAddress: string | null;
    imageUrl: string;
  } | null;
  signOut: () => Promise<void>;
}): AuthProvider {
  return {
    // Called by Refine on every route to verify auth state
    check: async () => {
      if (clerk.userId) {
        return { authenticated: true };
      }
      return {
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      };
    },

    // Returns the current user identity (shown in Refine UI helpers)
    getIdentity: async () => {
      if (!clerk.user) return null;
      return {
        id: clerk.userId,
        name: clerk.user.fullName ?? "Unknown",
        email: clerk.user.primaryEmailAddress ?? undefined,
        avatar: clerk.user.imageUrl,
        orgId: clerk.orgId,
        orgRole: clerk.orgRole,
      };
    },

    // Returns the user's role for Refine's getPermissions
    getPermissions: async () => {
      return clerk.orgRole ? { role: clerk.orgRole } : null;
    },

    // Clerk's signOut — Refine calls this when logout is triggered
    logout: async () => {
      await clerk.signOut();
      return { success: true, redirectTo: "/login" };
    },

    // Refine calls login() but Clerk handles login via its own components
    login: async () => {
      return { success: true, redirectTo: "/" };
    },

    // Handle auth errors (401/403) — redirect to login
    onError: async (error) => {
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 401 || status === 403) {
        return { logout: true, redirectTo: "/login" };
      }
      return {};
    },
  };
}
