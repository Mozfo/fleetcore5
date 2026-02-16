"use client";

import { useTranslation } from "react-i18next";
import type { Lead } from "../types/lead.types";

interface LeadExpandedRowProps {
  lead: Lead;
}

export function LeadExpandedRow({ lead }: LeadExpandedRowProps) {
  const { t } = useTranslation("crm");
  const hasMessage = !!lead.message;
  const hasNotes = !!lead.qualification_notes;

  if (!hasMessage && !hasNotes) {
    return (
      <p className="text-muted-foreground text-sm italic">
        {t("leads.expanded.no_notes", { defaultValue: "No notes" })}
      </p>
    );
  }

  return (
    <div className="grid gap-4 text-sm md:grid-cols-2">
      {hasMessage && (
        <div>
          <span className="text-muted-foreground text-xs font-medium">
            {t("leads.table.columns.message")}
          </span>
          <p className="mt-1 whitespace-pre-line">{lead.message}</p>
        </div>
      )}
      {hasNotes && (
        <div>
          <span className="text-muted-foreground text-xs font-medium">
            {t("leads.table.columns.qualification_notes")}
          </span>
          <p className="mt-1 whitespace-pre-line">{lead.qualification_notes}</p>
        </div>
      )}
    </div>
  );
}
