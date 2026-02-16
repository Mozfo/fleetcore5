"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { DashboardData } from "../types/dashboard.types";

interface UseDashboardDataParams {
  startDate?: Date;
  endDate?: Date;
}

async function fetchDashboardData(
  startDate?: Date,
  endDate?: Date
): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", format(startDate, "yyyy-MM-dd"));
  if (endDate) params.set("end_date", format(endDate, "yyyy-MM-dd"));

  const res = await fetch(`/api/v1/crm/leads/stats?${params}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard data");

  const json = await res.json();
  return json.data as DashboardData;
}

export function useDashboardData({
  startDate,
  endDate,
}: UseDashboardDataParams = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "crm-dashboard-stats",
      startDate ? format(startDate, "yyyy-MM-dd") : null,
      endDate ? format(endDate, "yyyy-MM-dd") : null,
    ],
    queryFn: () => fetchDashboardData(startDate, endDate),
  });

  return {
    data: data ?? null,
    isLoading,
    isError,
  };
}
