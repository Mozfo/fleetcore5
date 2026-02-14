"use client";

import type { CrudFilter, CrudSort, Pagination } from "@refinedev/core";

/**
 * Convert Refine CrudFilter[] to FleetCore API query params.
 *
 * FleetCore API routes accept flat query params:
 *   - status, lead_stage, assigned_to, country_code  → "eq" filters
 *   - search                                          → "contains" on email/company/name
 *   - min_score                                       → "gte" on qualification_score
 *   - min_{field}, max_{field}                        → "gte" / "lte" range filters
 *   - {field} with comma-separated values             → "in" filters
 */
export function filtersToQuery(filters?: CrudFilter[]): Record<string, string> {
  if (!filters?.length) return {};

  const params: Record<string, string> = {};

  for (const filter of filters) {
    if (!("field" in filter)) continue;

    const f = filter;

    switch (f.operator) {
      case "eq":
        params[f.field] = String(f.value);
        break;
      case "contains":
        // FleetCore API uses a single "search" param for text search
        params["search"] = String(f.value);
        break;
      case "in":
        if (Array.isArray(f.value)) {
          params[f.field] = f.value.join(",");
        }
        break;
      case "gte":
        params[`min_${f.field}`] = String(f.value);
        break;
      case "lte":
        params[`max_${f.field}`] = String(f.value);
        break;
    }
  }

  return params;
}

/**
 * Convert Refine CrudSort[] to FleetCore API query params.
 *
 * FleetCore API routes accept: sort={field}&order={asc|desc}
 * Only the first sorter is used (single-column sort).
 */
export function sortersToQuery(sorters?: CrudSort[]): Record<string, string> {
  if (!sorters?.length) return {};

  return {
    sort: sorters[0].field,
    order: sorters[0].order,
  };
}

/**
 * Convert Refine Pagination to FleetCore API query params.
 *
 * FleetCore API routes accept: page={number}&limit={number}
 */
export function paginationToQuery(
  pagination?: Pagination
): Record<string, string> {
  const { currentPage = 1, pageSize = 10 } = pagination ?? {};

  return {
    page: String(currentPage),
    limit: String(pageSize),
  };
}
