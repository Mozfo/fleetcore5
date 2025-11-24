/**
 * EmptyColumn - Empty state pour colonnes Kanban vides
 * Messages contextuels selon la colonne
 */

"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Inbox, Users, CheckCircle2, XCircle, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LeadStatus } from "@/types/crm";

interface EmptyColumnProps {
  columnId: LeadStatus;
  onCreate?: () => void;
}

export function EmptyColumn({ columnId, onCreate }: EmptyColumnProps) {
  const { t } = useTranslation("crm");

  const emptyConfigs: Record<
    LeadStatus,
    {
      icon: React.ReactNode;
      titleKey: string;
      descriptionKey: string;
    }
  > = {
    new: {
      icon: <Inbox className="h-12 w-12" />,
      titleKey: "leads.empty.column_new",
      descriptionKey: "leads.empty.column_new_desc",
    },
    working: {
      icon: <Users className="h-12 w-12" />,
      titleKey: "leads.empty.column_working",
      descriptionKey: "leads.empty.column_working_desc",
    },
    qualified: {
      icon: <CheckCircle2 className="h-12 w-12" />,
      titleKey: "leads.empty.column_qualified",
      descriptionKey: "leads.empty.column_qualified_desc",
    },
    lost: {
      icon: <XCircle className="h-12 w-12" />,
      titleKey: "leads.empty.column_lost",
      descriptionKey: "leads.empty.column_lost_desc",
    },
  };

  const config = emptyConfigs[columnId];

  return (
    <EmptyState
      icon={config.icon}
      title={t(config.titleKey)}
      description={t(config.descriptionKey)}
      action={
        columnId === "new" && onCreate
          ? {
              label: t("leads.empty.create_lead"),
              onClick: onCreate,
              icon: <Plus className="h-4 w-4" />,
            }
          : undefined
      }
    />
  );
}
