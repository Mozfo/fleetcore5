"use client";

import type { AuthProvider } from "@refinedev/core";

/**
 * Factory that creates a Refine AuthProvider from auth runtime values.
 *
 * Why a factory? Auth hooks can only be called inside React components.
 * The AuthProvider is a plain object passed to <Refine>. The factory
 * bridges the two: the layout component calls hooks, then passes
 * their values here.
 *
 * This provider is an OBSERVER of auth state -- it does NOT control
 * login/logout flows. Auth pages handle those directly.
 */
export function createAuthProvider(authData: {
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
      if (authData.userId) {
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
      if (!authData.user) return null;
      return {
        id: authData.userId,
        name: authData.user.fullName ?? "Unknown",
        email: authData.user.primaryEmailAddress ?? undefined,
        avatar: authData.user.imageUrl,
        orgId: authData.orgId,
        orgRole: authData.orgRole,
      };
    },

    // Returns the user's role for Refine's getPermissions
    getPermissions: async () => {
      return authData.orgRole ? { role: authData.orgRole } : null;
    },

    // Sign out -- Refine calls this when logout is triggered
    logout: async () => {
      await authData.signOut();
      return { success: true, redirectTo: "/login" };
    },

    // Refine calls login() but auth pages handle login directly
    login: async () => {
      return { success: true, redirectTo: "/" };
    },

    // Handle auth errors (401/403) -- redirect to login
    onError: async (error) => {
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 401 || status === 403) {
        return { logout: true, redirectTo: "/login" };
      }
      return {};
    },
  };
}
