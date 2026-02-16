"use client";

import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { TotalLeadsCardProps } from "../../types/dashboard.types";

export function TotalLeadsCard({ total, trend }: TotalLeadsCardProps) {
  const { t } = useTranslation("crm");

  return (
    <Card>
      <CardHeader>
        <CardDescription>{t("dashboard.total_leads")}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">
            {total.toLocaleString()}
          </h4>
          <div className="text-muted-foreground text-sm">
            <span className={trend >= 0 ? "text-green-600" : "text-red-600"}>
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>{" "}
            {t("dashboard.from_previous")}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Users className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
