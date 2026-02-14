"use client";

import type { AuditLogProvider } from "@refinedev/core";

/**
 * Placeholder AuditLogProvider for Refine.
 *
 * FleetCore audit logging is handled server-side inside Server Actions
 * (db.adm_audit_logs.create). This provider satisfies Refine's interface
 * without duplicating that logic. It returns no-op responses.
 *
 * When Refine triggers audit events, the real audit trail is already
 * captured by the Server Actions called through the DataProvider.
 */
export const fleetcoreAuditLogProvider: AuditLogProvider = {
  create: async () => ({}),
  get: async () => [],
  update: async () => ({}),
};
