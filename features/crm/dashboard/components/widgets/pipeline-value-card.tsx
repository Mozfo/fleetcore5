"use client";

import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { PipelineValueCardProps } from "../../types/dashboard.types";

export function PipelineValueCard({
  activeLeads,
  byStatus: _byStatus,
}: PipelineValueCardProps) {
  const { t } = useTranslation("crm");

  return (
    <Card>
      <CardHeader>
        <CardDescription>{t("dashboard.pipeline_value")}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">
            {activeLeads.toLocaleString()}
          </h4>
          <div className="text-muted-foreground text-sm">
            {t("dashboard.active_in_pipeline")}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Activity className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
