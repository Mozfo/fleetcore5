/**
 * Better Auth — Client Configuration
 *
 * Client-side auth hooks and methods.
 * Used in React components and pages.
 *
 * @module lib/auth-client
 */

"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient(), adminClient()],
});

// Convenience re-exports for direct use in components
export const { useSession, signIn, signUp, signOut } = authClient;
