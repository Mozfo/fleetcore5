"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { TargetCardProps } from "../../types/dashboard.types";

const chartConfig = {
  target: {
    label: "Target",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function TargetCard({
  conversionRate,
  targetRate,
  qualifiedThisPeriod: _qualifiedThisPeriod,
}: TargetCardProps) {
  const { t } = useTranslation("crm");

  const percent = Math.min(
    100,
    Math.max(0, Math.round((conversionRate / targetRate) * 100))
  );
  const endAngle = (percent / 100) * 360;
  const chartData = [{ value: percent, fill: "var(--color-target)" }];

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          {t("dashboard.target_card.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[60px]"
            >
              <RadialBarChart
                data={chartData}
                startAngle={0}
                endAngle={endAngle}
                innerRadius={25}
                outerRadius={20}
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  polarRadius={[86, 74]}
                />
                <RadialBar dataKey="value" background cornerRadius={10} />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground font-bold"
                            >
                              {percent}%
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ChartContainer>
          </div>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.target_card.description", { percent })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
