/**
 * CrmSettingsPageClient - Client Component for CRM Settings
 *
 * Tab-based navigation with 7 sections:
 * - Pipeline (Phase 1) - Lead stages + Opportunity stages
 * - Loss Reasons (Phase 1)
 * - Lead Scoring (Phase 2)
 * - Lead Assignment (Phase 2)
 * - Notifications (Phase 3)
 * - Data Quality (Phase 3)
 * - Regional (Phase 3)
 *
 * @module components/crm/settings/CrmSettingsPageClient
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  GitBranch,
  XCircle,
  Calculator,
  Users,
  Bell,
  ShieldCheck,
  Globe,
  Lock,
} from "lucide-react";
import { FCPageHeader } from "@/components/fc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PipelineSettingsTab } from "./PipelineSettingsTab";
import { LossReasonsSettingsTab } from "./LossReasonsSettingsTab";
import type { CrmSettingsData } from "./types";

/**
 * Tab configuration with phase info
 */
const SETTINGS_TABS = [
  {
    id: "pipeline",
    labelKey: "settings.tabs.pipeline",
    icon: GitBranch,
    enabled: true,
    phase: 1,
  },
  {
    id: "loss_reasons",
    labelKey: "settings.tabs.loss_reasons",
    icon: XCircle,
    enabled: true,
    phase: 1,
  },
  {
    id: "scoring",
    labelKey: "settings.tabs.scoring",
    icon: Calculator,
    enabled: false,
    phase: 2,
  },
  {
    id: "assignment",
    labelKey: "settings.tabs.assignment",
    icon: Users,
    enabled: false,
    phase: 2,
  },
  {
    id: "notifications",
    labelKey: "settings.tabs.notifications",
    icon: Bell,
    enabled: false,
    phase: 3,
  },
  {
    id: "data_quality",
    labelKey: "settings.tabs.data_quality",
    icon: ShieldCheck,
    enabled: false,
    phase: 3,
  },
  {
    id: "regional",
    labelKey: "settings.tabs.regional",
    icon: Globe,
    enabled: false,
    phase: 3,
  },
] as const;

interface CrmSettingsPageClientProps {
  settings: CrmSettingsData;
  initialTab: string;
}

export function CrmSettingsPageClient({
  settings,
  initialTab,
}: CrmSettingsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation("crm");

  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes (without page reload)
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="bg-fc-bg-app flex h-full flex-col">
      {/* FCPageHeader 48px */}
      <FCPageHeader
        title={t("settings.title", "CRM Settings")}
        subtitle={t(
          "settings.description",
          "Configure pipeline stages, loss reasons, and other CRM settings"
        )}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex-1"
        >
          <TabsList className="grid w-full grid-cols-7 lg:inline-flex lg:w-auto">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={!tab.enabled}
                  className="data-[state=active]:bg-background relative flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">
                    {t(tab.labelKey, tab.id)}
                  </span>
                  {!tab.enabled && (
                    <Lock className="text-fc-text-muted absolute -top-1 -right-1 h-3 w-3" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="pipeline" className="mt-6 flex-1">
            <PipelineSettingsTab
              leadStages={settings.leadStages}
              opportunityStages={settings.opportunityStages}
            />
          </TabsContent>

          <TabsContent value="loss_reasons" className="mt-6 flex-1">
            <LossReasonsSettingsTab lossReasons={settings.lossReasons} />
          </TabsContent>

          {/* Disabled tabs - Coming Soon */}
          {SETTINGS_TABS.filter((tab) => !tab.enabled).map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <ComingSoonPlaceholder
                tabName={t(tab.labelKey, tab.id)}
                phase={tab.phase}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Placeholder for disabled tabs
 */
function ComingSoonPlaceholder({
  tabName,
  phase,
}: {
  tabName: string;
  phase: number;
}) {
  const { t } = useTranslation("crm");

  return (
    <div className="border-fc-border-light bg-fc-bg-hover flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 dark:border-gray-700 dark:bg-gray-900">
      <Lock className="text-fc-text-muted h-12 w-12" />
      <h3 className="text-fc-text-primary mt-4 text-lg font-medium dark:text-white">
        {tabName}
      </h3>
      <p className="text-fc-text-muted mt-2 text-sm dark:text-gray-400">
        {t("settings.comingSoon", "Coming in Phase {{phase}}", { phase })}
      </p>
    </div>
  );
}
