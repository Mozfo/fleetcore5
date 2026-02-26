"use client";

import { createContext, useContext } from "react";
import type { AuthSession } from "@/lib/auth/server";

/**
 * ServerAuthProvider — bridges server-fetched auth data to client hooks.
 *
 * Pattern from Better Auth community (GitHub Issue #4319):
 * Server layout fetches session once, injects into context.
 * Client hooks read from context while Better Auth hooks are pending,
 * then switch to live hook data once resolved.
 *
 * This eliminates 3 HTTP round-trips per page navigation:
 * - GET /api/auth/get-session
 * - GET /api/auth/organization/get-active-member
 * - GET /api/auth/organization/get-full-organization
 */

const ServerAuthContext = createContext<AuthSession | null>(null);

export function ServerAuthProvider({
  session,
  children,
}: {
  session: AuthSession | null;
  children: React.ReactNode;
}) {
  return (
    <ServerAuthContext.Provider value={session}>
      {children}
    </ServerAuthContext.Provider>
  );
}

export function useServerAuth(): AuthSession | null {
  return useContext(ServerAuthContext);
}
