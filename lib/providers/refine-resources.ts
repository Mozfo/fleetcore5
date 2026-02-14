"use client";

import type { ResourceProps } from "@refinedev/core";

/**
 * Refine resource definitions for FleetCore.
 *
 * Phase 1C: Only "leads" is registered. Other CRM resources (opportunities,
 * quotes, orders, agreements) and fleet modules will be added incrementally
 * as each module is migrated.
 *
 * Routes follow the existing Next.js App Router structure:
 *   /[locale]/dashboard/crm/leads/*
 */
export const fleetcoreResources: ResourceProps[] = [
  {
    name: "leads",
    list: "/dashboard/crm/leads",
    show: "/dashboard/crm/leads/:id",
    create: "/dashboard/crm/leads/new",
    edit: "/dashboard/crm/leads/:id/edit",
    meta: {
      label: "Leads",
      canDelete: true,
      parent: "crm",
      audit: ["create", "update", "delete"],
    },
  },
];
