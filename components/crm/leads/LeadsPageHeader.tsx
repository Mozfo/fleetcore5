/**
 * LeadsPageHeader - Header avec titre, stats Stripe-style, et actions
 * 4 stat cards: NEW, WORKING, QUALIFIED, PIPELINE VALUE
 * Actions: New Lead, Export, Settings
 */

"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Download,
  Settings,
  Inbox,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { useTranslation } from "react-i18next";

interface LeadsPageHeaderProps {
  stats: {
    newCount: number;
    workingCount: number;
    qualifiedCount: number;
    pipelineValue: string; // Formatted currency like "$2.5M" or "2,5M €"
  };
  onNewLead?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

export function LeadsPageHeader({
  stats,
  onNewLead,
  onExport,
  onSettings,
}: LeadsPageHeaderProps) {
  const { t } = useTranslation("crm");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Title + Description + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("leads.title")}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t("leads.description")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {onSettings && (
            <Button variant="outline" size="sm" onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" />
              {t("leads.actions.settings")}
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              {t("leads.actions.export")}
            </Button>
          )}
          {onNewLead && (
            <Button size="sm" onClick={onNewLead}>
              <Plus className="mr-2 h-4 w-4" />
              {t("leads.actions.new_lead")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid - Stripe Style */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.2,
            },
          },
        }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            icon={<Inbox className="h-4 w-4" />}
            label={t("leads.stats.new")}
            value={stats.newCount}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label={t("leads.stats.working")}
            value={stats.workingCount}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={t("leads.stats.qualified")}
            value={stats.qualifiedCount}
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label={t("leads.stats.pipeline")}
            value={stats.pipelineValue}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
