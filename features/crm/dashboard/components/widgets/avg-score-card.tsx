"use client";

import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { AvgScoreCardProps } from "../../types/dashboard.types";

export function AvgScoreCard({
  avgQualificationScore,
  avgFitScore,
  avgEngagementScore,
}: AvgScoreCardProps) {
  const { t } = useTranslation("crm");

  return (
    <Card>
      <CardHeader>
        <CardDescription>{t("dashboard.avg_score")}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">
            {avgQualificationScore}
          </h4>
          <div className="text-muted-foreground text-sm">
            {t("dashboard.fit")}: {avgFitScore} · {t("dashboard.engagement")}:{" "}
            {avgEngagementScore}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <BarChart3 className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
