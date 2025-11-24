/**
 * Utility functions for CRM Leads
 * Extracted for client-side filtering with useMemo
 */

import type { Lead, LeadStatus, KanbanColumn } from "@/types/crm";

/**
 * Groups leads into Kanban columns by status
 * @param leads - Array of leads to group
 * @returns Array of KanbanColumn (new, working, qualified)
 */
export function groupLeadsIntoColumns(leads: Lead[]): KanbanColumn[] {
  const statusGroups: Record<LeadStatus, Lead[]> = {
    new: [],
    working: [],
    qualified: [],
    lost: [],
  };

  leads.forEach((lead) => {
    if (statusGroups[lead.status]) {
      statusGroups[lead.status].push(lead);
    }
  });

  // 3 colonnes affichées (sans "lost")
  const columns: KanbanColumn[] = [
    {
      id: "new",
      title: "New Leads",
      color: "blue",
      leads: statusGroups.new,
      count: statusGroups.new.length,
    },
    {
      id: "working",
      title: "In Progress",
      color: "yellow",
      leads: statusGroups.working,
      count: statusGroups.working.length,
    },
    {
      id: "qualified",
      title: "Qualified",
      color: "green",
      leads: statusGroups.qualified,
      count: statusGroups.qualified.length,
    },
  ];

  return columns;
}

/**
 * Calculate stats for LeadsPageHeader
 * @param leads - Array of leads to calculate stats from
 * @returns Stats object with counts and pipeline value
 */
export function calculateStats(leads: Lead[]): {
  newCount: number;
  workingCount: number;
  qualifiedCount: number;
  pipelineValue: string;
} {
  const newCount = leads.filter((l) => l.status === "new").length;
  const workingCount = leads.filter((l) => l.status === "working").length;
  const qualifiedCount = leads.filter((l) => l.status === "qualified").length;

  // Pipeline value estimation (fleet_size * $500 per vehicle)
  const pipelineValue = leads.reduce((sum, lead) => {
    const fleetSize = parseInt(lead.fleet_size || "0");
    return sum + fleetSize * 500;
  }, 0);

  // Format pipeline value
  const formattedValue =
    pipelineValue >= 1000000
      ? `$${(pipelineValue / 1000000).toFixed(1)}M`
      : pipelineValue >= 1000
        ? `$${(pipelineValue / 1000).toFixed(0)}K`
        : `$${pipelineValue}`;

  return {
    newCount,
    workingCount,
    qualifiedCount,
    pipelineValue: formattedValue,
  };
}
