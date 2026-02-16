"use client";

import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { SalesPipelineCardProps } from "../../types/dashboard.types";

export function SalesPipelineCard({
  byStatus: _byStatus,
}: SalesPipelineCardProps) {
  const { t } = useTranslation("crm");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.sales_pipeline")}</CardTitle>
        <CardDescription>{t("dashboard.pipeline_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">
          Placeholder
        </div>
      </CardContent>
    </Card>
  );
}
