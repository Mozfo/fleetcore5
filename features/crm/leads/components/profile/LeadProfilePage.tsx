"use client";

import { useState } from "react";
import { useOne } from "@refinedev/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LeadIdentityCard,
  LeadJourneyCard,
  LeadBantCard,
  LeadActivitiesCard,
  LeadCompanyCard,
  LeadAssignmentCard,
  LeadSourceCard,
  LeadQualificationCard,
  LeadAuditCard,
} from "./LeadProfileCards";
import type { Lead, Opportunity } from "@/types/crm";

interface LeadProfilePageProps {
  leadId: string;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <div className="space-y-4 xl:col-span-2">
          <Skeleton className="h-64 rounded-lg" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Structure = COPIE de /pages/profile/page.tsx L23-63 ──
// ── PAS de <Tabs>. PAS de toggle. TOUT visible sur UNE page. ──
export function LeadProfilePage({ leadId }: LeadProfilePageProps) {
  const [refreshTrigger] = useState(0);

  const { result: lead, query: leadQuery } = useOne<Lead>({
    resource: "leads",
    id: leadId,
    queryOptions: { enabled: !!leadId },
  });

  const { result: opportunity } = useOne<Opportunity>({
    resource: "opportunities",
    id: lead?.opportunity_id ?? "",
    queryOptions: { enabled: !!lead?.opportunity_id },
  });

  if (leadQuery.isLoading || !lead) {
    return <ProfileSkeleton />;
  }

  const fullName = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim();

  return (
    <div className="space-y-4">
      {/* ── ROW 1 : Titre (copie pages/profile/page.tsx L26-35) ── */}
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
          {fullName || lead.email}
        </h1>
      </div>

      {/* ── ROW 2 : Grid principal (copie pages/profile/page.tsx L47-60) ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* ── SIDEBAR (col-span-1) ── */}
        <div className="space-y-4 xl:col-span-1">
          {/* Carte 1 : Identité lead */}
          <LeadIdentityCard lead={lead} />

          {/* Carte 2 : Lead Journey — COMPACT */}
          <LeadJourneyCard lead={lead} opportunity={opportunity} />

          {/* Carte 3 : BANT Score — COMPACT */}
          <LeadBantCard lead={lead} />
        </div>

        {/* ── MAIN (col-span-2) ── */}
        <div className="space-y-4 xl:col-span-2">
          {/* Carte 4 : Latest Activities — GRANDE carte */}
          <LeadActivitiesCard
            leadId={lead.id}
            lead={lead}
            refreshTrigger={refreshTrigger}
          />

          {/* Carte 5-9 : Grid fluide de petites cartes */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LeadCompanyCard lead={lead} />
            <LeadAssignmentCard lead={lead} />
            <LeadSourceCard lead={lead} />
            <LeadQualificationCard lead={lead} />
            <LeadAuditCard lead={lead} />
          </div>
        </div>
      </div>
    </div>
  );
}
