/**
 * PipelinePreview - Visual Pipeline Representation
 *
 * Displays a visual flow of the pipeline stages:
 * [Qual 20%] → [Demo 40%] → [Prop 60%] → [Nego 80%] → [Sent 90%]
 *     14d          10d          14d          10d          7d
 *
 * @module components/crm/settings/PipelinePreview
 */

"use client";

import { useTranslation } from "react-i18next";
import { ArrowRight, Trophy, XCircle, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OpportunityStage, LeadStage } from "./types";

type StageColor =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "gray"
  | "pink"
  | "indigo"
  | "teal";

const COLOR_BG: Record<StageColor, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  gray: "bg-gray-500",
  pink: "bg-pink-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
};

const COLOR_TEXT: Record<StageColor, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
  green: "text-green-600 dark:text-green-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  orange: "text-orange-600 dark:text-orange-400",
  red: "text-red-600 dark:text-red-400",
  gray: "text-gray-600 dark:text-gray-400",
  pink: "text-pink-600 dark:text-pink-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  teal: "text-teal-600 dark:text-teal-400",
};

// ============================================================================
// Opportunity Pipeline Preview
// ============================================================================

interface OpportunityPipelinePreviewProps {
  stages: OpportunityStage[];
}

export function OpportunityPipelinePreview({
  stages,
}: OpportunityPipelinePreviewProps) {
  const { t } = useTranslation("crm");

  if (stages.length === 0) {
    return null;
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="text-muted-foreground h-4 w-4" />
          <CardTitle className="text-base">
            {t("settings.pipeline.preview.title", "Pipeline Preview")}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {t(
            "settings.pipeline.preview.description",
            "Visual representation of your opportunity pipeline flow"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {sortedStages.map((stage, index) => (
            <div key={stage.value} className="flex items-center">
              {/* Stage Box */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex min-w-[80px] flex-col items-center rounded-lg border-2 px-3 py-2 ${
                    COLOR_TEXT[stage.color as StageColor] || COLOR_TEXT.gray
                  } border-current bg-current/10`}
                >
                  <span className="text-xs font-medium whitespace-nowrap">
                    {stage.label_en}
                  </span>
                  <span className="text-lg font-bold">
                    {stage.probability}%
                  </span>
                </div>
                <span className="text-muted-foreground mt-1 text-xs">
                  {stage.max_days}d max
                </span>
              </div>

              {/* Arrow */}
              {index < sortedStages.length - 1 && (
                <ArrowRight className="text-muted-foreground mx-1 h-4 w-4 flex-shrink-0" />
              )}
            </div>
          ))}

          {/* Final States */}
          <ArrowRight className="text-muted-foreground mx-1 h-4 w-4 flex-shrink-0" />

          <div className="flex gap-2">
            {/* Won */}
            <div className="flex flex-col items-center">
              <div className="flex min-w-[60px] flex-col items-center rounded-lg border-2 border-green-500 bg-green-500/10 px-3 py-2 text-green-600 dark:text-green-400">
                <Trophy className="h-4 w-4" />
                <span className="text-xs font-medium">Won</span>
                <span className="text-sm font-bold">100%</span>
              </div>
            </div>

            {/* Lost */}
            <div className="flex flex-col items-center">
              <div className="flex min-w-[60px] flex-col items-center rounded-lg border-2 border-red-500 bg-red-500/10 px-3 py-2 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Lost</span>
                <span className="text-sm font-bold">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {t("settings.pipeline.preview.stages", "Stages:")}
            </span>
            <span className="font-medium">{stages.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {t(
                "settings.pipeline.preview.avgProbability",
                "Avg probability:"
              )}
            </span>
            <span className="font-medium">
              {Math.round(
                stages.reduce((sum, s) => sum + s.probability, 0) /
                  stages.length
              )}
              %
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {t("settings.pipeline.preview.totalDays", "Total max days:")}
            </span>
            <span className="font-medium">
              {stages.reduce((sum, s) => sum + s.max_days, 0)}d
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Lead Pipeline Preview
// ============================================================================

interface LeadPipelinePreviewProps {
  stages: LeadStage[];
}

export function LeadPipelinePreview({ stages }: LeadPipelinePreviewProps) {
  const { t } = useTranslation("crm");

  if (stages.length === 0) {
    return null;
  }

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="text-muted-foreground h-4 w-4" />
          <CardTitle className="text-base">
            {t("settings.pipeline.preview.leadTitle", "Lead Flow Preview")}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {t(
            "settings.pipeline.preview.leadDescription",
            "Visual representation of your lead pipeline flow"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {sortedStages.map((stage, index) => (
            <div key={stage.value} className="flex items-center">
              {/* Stage Box */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex min-w-[70px] items-center justify-center rounded-lg border-2 px-3 py-2 ${
                    COLOR_TEXT[stage.color as StageColor] || COLOR_TEXT.gray
                  } border-current bg-current/10`}
                >
                  <span className="text-xs font-medium whitespace-nowrap">
                    {stage.label_en}
                  </span>
                </div>
                <div className="mt-1 flex h-4 items-center justify-center">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      COLOR_BG[stage.color as StageColor] || COLOR_BG.gray
                    }`}
                  />
                </div>
              </div>

              {/* Arrow */}
              {index < sortedStages.length - 1 && (
                <ArrowRight className="text-muted-foreground mx-1 h-4 w-4 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {t("settings.pipeline.preview.stages", "Stages:")}
            </span>
            <span className="font-medium">{stages.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
