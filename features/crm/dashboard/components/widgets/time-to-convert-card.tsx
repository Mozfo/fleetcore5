"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { TimeToConvertCardProps } from "../../types/dashboard.types";

export function TimeToConvertCard({ avgDays }: TimeToConvertCardProps) {
  const { t } = useTranslation("crm");

  return (
    <Card>
      <CardHeader>
        <CardDescription>{t("dashboard.time_to_convert")}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">{avgDays}</h4>
          <div className="text-muted-foreground text-sm">
            {t("dashboard.days")} · {t("dashboard.avg_to_qualification")}
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Clock className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
