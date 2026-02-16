"use client";

import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function RecentTasksCard() {
  const { t } = useTranslation("crm");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.recent_tasks")}</CardTitle>
        <CardDescription>{t("dashboard.tasks_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">
          Placeholder
        </div>
      </CardContent>
    </Card>
  );
}
