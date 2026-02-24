"use client";

/**
 * useSidebarFilterData — loads dynamic filter values for the leads sidebar.
 *
 * Fetches operational countries and platforms from the DB via SWR.
 * Falls back to hardcoded defaults if the API is unavailable.
 */

import useSWR from "swr";

// ── Types ──────────────────────────────────────────────────────────────────

interface CountryOption {
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  flag_emoji: string | null;
}

interface PlatformOption {
  code: string;
  name_translations: Record<string, string>;
}

// ── Defaults (fallback if API unavailable) ──────────────────────────────────

const DEFAULT_COUNTRIES = [
  "AE",
  "SA",
  "QA",
  "KW",
  "BH",
  "OM",
  "FR",
  "GB",
  "US",
];

const DEFAULT_PLATFORMS = ["uber", "bolt", "careem", "freenow", "lyft"];

// ── Fetcher ─────────────────────────────────────────────────────────────────

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useSidebarFilterData() {
  const { data: countriesData } = useSWR<{ data: CountryOption[] }>(
    "/api/admin/countries",
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const { data: platformsData } = useSWR<PlatformOption[]>(
    "/api/v1/directory/platforms",
    jsonFetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const countryCodes: string[] =
    countriesData?.data?.map((c) => c.country_code) ?? DEFAULT_COUNTRIES;

  const platformCodes: string[] =
    platformsData?.map((p) => p.code) ?? DEFAULT_PLATFORMS;

  return { countryCodes, platformCodes };
}
