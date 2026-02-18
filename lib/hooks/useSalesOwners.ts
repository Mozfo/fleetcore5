/**
 * useSalesOwners - Hook to load active Sales team members for assignment dropdowns.
 *
 * Uses SWR with long dedup interval (owners list changes rarely).
 *
 * @see app/api/v1/crm/owners/route.ts
 */

"use client";

import useSWR from "swr";

export interface SalesOwner {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface OwnersApiResponse {
  success: boolean;
  data?: SalesOwner[];
  error?: { code: string; message: string };
}

const fetcher = async (url: string): Promise<OwnersApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

export function useSalesOwners() {
  const { data, error, isLoading } = useSWR<OwnersApiResponse>(
    "/api/v1/crm/owners",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes — owners list rarely changes
      revalidateOnReconnect: true,
      errorRetryCount: 2,
    }
  );

  const owners: SalesOwner[] = data?.success && data.data ? data.data : [];

  return { owners, isLoading, error };
}
