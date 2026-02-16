"use client";

import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ConversionRateCardProps } from "../../types/dashboard.types";

export function ConversionRateCard({
  rate: _rate,
  trend: _trend,
  qualified: _qualified,
}: ConversionRateCardProps) {
  const { t } = useTranslation("crm");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.conversion_rate")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">
          Placeholder
        </div>
      </CardContent>
    </Card>
  );
}
