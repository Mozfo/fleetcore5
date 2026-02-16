"use client";

import { useTranslation } from "react-i18next";
import type { Lead } from "../types/lead.types";

interface LeadExpandedRowProps {
  lead: Lead;
}

export function LeadExpandedRow({ lead }: LeadExpandedRowProps) {
  const { t } = useTranslation("crm");

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3 lg:grid-cols-4">
      <Field label={t("leads.table.columns.email")} value={lead.email} />
      <Field label={t("leads.table.columns.phone")} value={lead.phone} />
      <Field
        label={t("leads.table.columns.company")}
        value={lead.company_name}
      />
      <Field label={t("leads.table.columns.industry")} value={lead.industry} />
      <Field
        label={t("leads.table.columns.fleet_size")}
        value={lead.fleet_size?.toString()}
      />
      <Field label={t("leads.table.columns.source")} value={lead.source} />
      <Field label={t("leads.table.columns.status")} value={lead.status} />
      <Field label={t("leads.table.columns.priority")} value={lead.priority} />
      <Field
        label={t("leads.table.columns.score")}
        value={lead.qualification_score?.toString()}
      />
      <Field
        label={t("leads.table.columns.country")}
        value={
          lead.country?.flag_emoji
            ? `${lead.country.flag_emoji} ${lead.country_code}`
            : lead.country_code
        }
      />
      <Field label={t("leads.table.columns.city")} value={lead.city} />
      <Field
        label={t("leads.table.columns.message")}
        value={lead.message}
        className="col-span-2"
      />
      <Field
        label={t("leads.table.columns.qualification_notes")}
        value={lead.qualification_notes}
        className="col-span-2"
      />
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="truncate">{value}</p>
    </div>
  );
}
