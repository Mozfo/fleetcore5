"use client";

import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { TargetCardProps } from "../../types/dashboard.types";

export function TargetCard({
  conversionRate: _conversionRate,
  targetRate: _targetRate,
  qualifiedThisPeriod: _qualifiedThisPeriod,
}: TargetCardProps) {
  const { t } = useTranslation("crm");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.target_card.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">
          Placeholder
        </div>
      </CardContent>
    </Card>
  );
}
