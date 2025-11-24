/**
 * LeadsPageClient - Client Component pour filtrage instantané
 *
 * Architecture:
 * - Reçoit TOUS les leads du Server Component (max 100)
 * - Filtre côté client avec useMemo (~5ms)
 * - URL sync avec replaceState (pas de reload)
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { LeadsPageHeader } from "./LeadsPageHeader";
import { LeadsFilterBar, type LeadsFilters } from "./LeadsFilterBar";
import { KanbanBoard } from "./KanbanBoard";
import { groupLeadsIntoColumns, calculateStats } from "./utils/lead-utils";
import type { Lead } from "@/types/crm";

interface LeadsPageClientProps {
  allLeads: Lead[];
  countries: Array<{
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  }>;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  initialFilters: LeadsFilters;
}

export function LeadsPageClient({
  allLeads,
  countries,
  owners,
  initialFilters,
}: LeadsPageClientProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Filter state (client-side)
  const [filters, setFilters] = useState<LeadsFilters>(initialFilters);

  // Client-side filtering with useMemo (~3-5ms for 100 leads)
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // Lead stage filter
      if (
        filters.lead_stage &&
        filters.lead_stage !== "all" &&
        lead.lead_stage !== filters.lead_stage
      ) {
        return false;
      }

      // Assigned to filter
      if (filters.assigned_to && filters.assigned_to !== "all") {
        if (filters.assigned_to === "unassigned" && lead.assigned_to !== null) {
          return false;
        }
        if (
          filters.assigned_to !== "unassigned" &&
          lead.assigned_to?.id !== filters.assigned_to
        ) {
          return false;
        }
      }

      // Country filter
      if (
        filters.country_code &&
        filters.country_code !== "all" &&
        lead.country_code !== filters.country_code
      ) {
        return false;
      }

      // Min score filter
      if (
        filters.min_score !== undefined &&
        (lead.qualification_score || 0) < filters.min_score
      ) {
        return false;
      }

      // Search filter (email, company, first_name, last_name)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.company_name?.toLowerCase().includes(searchLower) ||
          lead.first_name?.toLowerCase().includes(searchLower) ||
          lead.last_name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [allLeads, filters]);

  // Group filtered leads into Kanban columns (~1ms)
  const columns = useMemo(() => {
    return groupLeadsIntoColumns(filteredLeads);
  }, [filteredLeads]);

  // Calculate stats from filtered leads (~1ms)
  const stats = useMemo(() => {
    return calculateStats(filteredLeads);
  }, [filteredLeads]);

  // Handle filter changes - NO router.push, just state update + URL sync
  const handleFiltersChange = useCallback(
    (newFilters: LeadsFilters) => {
      // Update local state (triggers useMemo re-computation)
      setFilters(newFilters);

      // Sync URL with replaceState (no page reload)
      const searchParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });

      const newUrl = searchParams.toString()
        ? `/${locale}/crm/leads?${searchParams}`
        : `/${locale}/crm/leads`;

      // Update URL without reload
      window.history.replaceState(null, "", newUrl);
    },
    [locale]
  );

  const handleCardClick = (leadId: string) => {
    router.push(`/${locale}/crm/leads/${leadId}`);
  };

  const handleCreateLead = () => {
    router.push(`/${locale}/crm/leads/new`);
  };

  const handleExport = () => {
    // TODO: Implement export functionality in future sprint
  };

  const handleSettings = () => {
    // TODO: Implement settings functionality in future sprint
  };

  return (
    <>
      {/* Page Header with Stats */}
      <LeadsPageHeader
        stats={stats}
        onNewLead={handleCreateLead}
        onExport={handleExport}
        onSettings={handleSettings}
      />

      {/* Filters Bar */}
      <LeadsFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        countries={countries}
        owners={owners}
        viewMode="kanban"
      />

      {/* Kanban Board */}
      <KanbanBoard
        columns={columns}
        onCardClick={handleCardClick}
        onCreate={handleCreateLead}
      />
    </>
  );
}
