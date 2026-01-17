/**
 * EmptyColumn - Empty state pour colonnes Kanban vides
 * Messages contextuels selon la colonne (phases ou statuts)
 *
 * V6.2-11: Supporte à la fois les IDs de phases et les statuts de leads
 */

"use client";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Inbox,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Target,
  Presentation,
  Handshake,
  Flag,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyColumnProps {
  columnId: string; // Can be phase ID or status ID
  onCreate?: () => void;
}

// Config type for empty states
interface EmptyConfig {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

export function EmptyColumn({ columnId, onCreate }: EmptyColumnProps) {
  const { t } = useTranslation("crm");

  // V6.2-11: Phase-based empty configs
  const phaseConfigs: Record<string, EmptyConfig> = {
    acquisition: {
      icon: <Target className="h-12 w-12" />,
      titleKey: "leads.empty.phase_acquisition",
      descriptionKey: "leads.empty.phase_acquisition_desc",
    },
    qualification: {
      icon: <CheckCircle2 className="h-12 w-12" />,
      titleKey: "leads.empty.phase_qualification",
      descriptionKey: "leads.empty.phase_qualification_desc",
    },
    demo: {
      icon: <Presentation className="h-12 w-12" />,
      titleKey: "leads.empty.phase_demo",
      descriptionKey: "leads.empty.phase_demo_desc",
    },
    closing: {
      icon: <Handshake className="h-12 w-12" />,
      titleKey: "leads.empty.phase_closing",
      descriptionKey: "leads.empty.phase_closing_desc",
    },
    result: {
      icon: <Flag className="h-12 w-12" />,
      titleKey: "leads.empty.phase_result",
      descriptionKey: "leads.empty.phase_result_desc",
    },
  };

  // Legacy status-based configs (for backwards compatibility)
  const statusConfigs: Record<string, EmptyConfig> = {
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

  // Try phase config first, then status config, then default
  const config = phaseConfigs[columnId] ||
    statusConfigs[columnId] || {
      icon: <Inbox className="h-12 w-12" />,
      titleKey: "leads.empty.no_results",
      descriptionKey: "leads.empty.no_results_desc",
    };

  // Show create action only for acquisition phase or new status
  const showCreateAction =
    (columnId === "acquisition" || columnId === "new") && onCreate;

  return (
    <EmptyState
      icon={config.icon}
      title={t(config.titleKey)}
      description={t(config.descriptionKey)}
      action={
        showCreateAction
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
