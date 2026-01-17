/**
 * Utility functions for CRM Leads
 * Extracted for client-side filtering with useMemo
 */

import type { Lead, LeadStatus, KanbanColumn } from "@/types/crm";

/**
 * Groups leads into Kanban columns by status
 * V6.3: 8 statuts
 * @param leads - Array of leads to group
 * @returns Array of KanbanColumn
 */
export function groupLeadsIntoColumns(leads: Lead[]): KanbanColumn[] {
  const statusGroups: Record<LeadStatus, Lead[]> = {
    new: [],
    demo: [],
    proposal_sent: [],
    payment_pending: [],
    converted: [],
    lost: [],
    nurturing: [],
    disqualified: [],
  };

  leads.forEach((lead) => {
    if (statusGroups[lead.status]) {
      statusGroups[lead.status].push(lead);
    }
  });

  // V6.3: 4 colonnes principales (actives)
  const columns: KanbanColumn[] = [
    {
      id: "new",
      title: "New Leads",
      color: "gray",
      leads: statusGroups.new,
      count: statusGroups.new.length,
    },
    {
      id: "demo",
      title: "Demo",
      color: "blue",
      leads: statusGroups.demo,
      count: statusGroups.demo.length,
    },
    {
      id: "proposal_sent",
      title: "Proposal Sent",
      color: "orange",
      leads: statusGroups.proposal_sent,
      count: statusGroups.proposal_sent.length,
    },
    {
      id: "payment_pending",
      title: "Payment Pending",
      color: "amber",
      leads: statusGroups.payment_pending,
      count: statusGroups.payment_pending.length,
    },
  ];

  return columns;
}

/**
 * Calculate stats for LeadsPageHeader
 * V6.3: Updated to use new status names
 * @param leads - Array of leads to calculate stats from
 * @returns Stats object with counts and pipeline value
 */
export function calculateStats(leads: Lead[]): {
  newCount: number;
  demoCount: number;
  proposalCount: number;
  pipelineValue: string;
} {
  const newCount = leads.filter((l) => l.status === "new").length;
  const demoCount = leads.filter((l) => l.status === "demo").length;
  const proposalCount = leads.filter(
    (l) => l.status === "proposal_sent" || l.status === "payment_pending"
  ).length;

  // Pipeline value estimation (fleet_size * $500 per vehicle)
  // RÈGLE MÉTIER V6.3: Seuls les leads actifs sont comptés dans le pipeline
  // Actifs = new, demo, proposal_sent, payment_pending
  const activeStatuses = ["new", "demo", "proposal_sent", "payment_pending"];
  const pipelineValue = leads
    .filter((l) => activeStatuses.includes(l.status))
    .reduce((sum, lead) => {
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
    demoCount,
    proposalCount,
    pipelineValue: formattedValue,
  };
}
