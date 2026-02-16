"use client";

import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AvgScoreCardProps } from "../../types/dashboard.types";

export function AvgScoreCard({
  avgQualificationScore: _avgQualificationScore,
  avgFitScore: _avgFitScore,
  avgEngagementScore: _avgEngagementScore,
}: AvgScoreCardProps) {
  const { t } = useTranslation("crm");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.avg_score")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">
          Placeholder
        </div>
      </CardContent>
    </Card>
  );
}
