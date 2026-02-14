"use client";

import type {
  DataProvider,
  HttpError,
  GetListParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteOneParams,
  GetListResponse,
  GetOneResponse,
  CreateResponse,
  UpdateResponse,
  DeleteOneResponse,
} from "@refinedev/core";
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "@/lib/actions/crm/lead.actions";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import {
  filtersToQuery,
  sortersToQuery,
  paginationToQuery,
} from "./refine-mappers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_URL = "/api/v1";

// ---------------------------------------------------------------------------
// Resource Configuration Registry
// ---------------------------------------------------------------------------

/**
 * Each resource declares its API base path.
 * Mutations can use Server Actions (SA) or API routes — declared per resource.
 *
 * For Phase 1C only "leads" is registered. Other resources will be added
 * incrementally as each module is migrated.
 */
interface ResourceConfig {
  apiPath: string;
}

const RESOURCE_CONFIG: Record<string, ResourceConfig> = {
  leads: {
    apiPath: "/crm/leads",
  },
};

function getResourceConfig(resource: string): ResourceConfig {
  const config = RESOURCE_CONFIG[resource];
  if (!config) {
    throw createHttpError(
      400,
      `Resource "${resource}" is not registered in the DataProvider. ` +
        `Registered resources: ${Object.keys(RESOURCE_CONFIG).join(", ")}`
    );
  }
  return config;
}

// ---------------------------------------------------------------------------
// Internal HTTP client
// ---------------------------------------------------------------------------

/**
 * Safely parse a JSON response body, returning a fallback on failure.
 */
async function safeJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Internal fetch wrapper with standardized Refine HttpError propagation.
 * All API routes return { success, data, pagination?, error? }.
 */
async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await safeJson(res);
    const errorObj = body?.error as
      | Record<string, unknown>
      | string
      | undefined;
    const message =
      (typeof errorObj === "object"
        ? (errorObj?.message as string)
        : errorObj) ?? res.statusText;
    throw createHttpError(res.status, message);
  }

  return res.json() as Promise<T>;
}

/**
 * Create a Refine-compatible HttpError.
 */
function createHttpError(statusCode: number, message: string): HttpError {
  return { statusCode, message, errors: {} };
}

/**
 * Wrap a Server Action result ({ success, error?, ... }) and extract
 * the data field. If !success, throws an HttpError.
 */
function unwrapActionResult(
  result: { success: boolean; error?: string } & Record<string, unknown>,
  dataKey: string = "data"
): Record<string, unknown> {
  if (!result.success) {
    throw createHttpError(400, result.error ?? "Action failed");
  }
  return (result as Record<string, unknown>)[dataKey] as Record<
    string,
    unknown
  >;
}

// ---------------------------------------------------------------------------
// Typed method implementations
// ---------------------------------------------------------------------------

async function getList(params: GetListParams): Promise<GetListResponse> {
  const { resource, pagination, sorters, filters } = params;
  const config = getResourceConfig(resource);

  const queryParams = new URLSearchParams({
    ...paginationToQuery(pagination),
    ...filtersToQuery(filters),
    ...sortersToQuery(sorters),
  });

  const res = await fetchApi<{
    success: boolean;
    data: Record<string, unknown>[];
    pagination: { total: number };
  }>(`${config.apiPath}?${queryParams}`);

  return {
    data: res.data,
    total: res.pagination.total,
  };
}

async function getOne(params: GetOneParams): Promise<GetOneResponse> {
  const { resource, id } = params;
  const config = getResourceConfig(resource);

  const res = await fetchApi<{
    success: boolean;
    data: Record<string, unknown>;
  }>(`${config.apiPath}/${id}`);

  return { data: res.data };
}

async function create(params: CreateParams): Promise<CreateResponse> {
  const { resource, variables } = params;
  const config = getResourceConfig(resource);

  const res = await fetchApi<{
    success: boolean;
    data: Record<string, unknown>;
  }>(config.apiPath, {
    method: "POST",
    body: JSON.stringify(variables),
  });

  return { data: res.data };
}

async function update(params: UpdateParams): Promise<UpdateResponse> {
  const { resource, id, variables, meta } = params;

  switch (resource) {
    case "leads": {
      // Kanban drag & drop — status-only update via Server Action
      if (meta?.statusOnly) {
        const vars = variables as Record<string, unknown>;
        const result = await updateLeadStatusAction(
          id as string,
          vars.status as string,
          {
            lossReasonCode: vars.lossReasonCode as string | undefined,
            nurturingReasonCode: vars.nurturingReasonCode as string | undefined,
            reasonDetail: vars.reasonDetail as string | undefined,
          }
        );
        return { data: unwrapActionResult(result) };
      }

      // Drawer edit mode — field update via Server Action
      const result = await updateLeadAction(
        id as string,
        variables as Parameters<typeof updateLeadAction>[1]
      );
      return { data: unwrapActionResult(result, "lead") };
    }
    default: {
      // Default: PATCH via API route
      const config = getResourceConfig(resource);
      const res = await fetchApi<{
        success: boolean;
        data: Record<string, unknown>;
      }>(`${config.apiPath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(variables),
      });
      return { data: res.data };
    }
  }
}

async function deleteOne(params: DeleteOneParams): Promise<DeleteOneResponse> {
  const { resource, id, variables } = params;

  switch (resource) {
    case "leads": {
      // Leads use Server Action for soft delete with reason + audit
      const vars = (variables ?? {}) as Record<string, unknown>;
      const reason = (vars.reason as string) ?? "other";
      const permanent = (vars.permanentDelete as boolean) ?? false;
      const result = await deleteLeadAction(id as string, reason, permanent);
      if (!result.success) {
        throw createHttpError(400, result.error ?? "Delete failed");
      }
      return { data: { id } };
    }
    default: {
      // Default: DELETE via API route
      const config = getResourceConfig(resource);
      await fetchApi(`${config.apiPath}/${id}`, { method: "DELETE" });
      return { data: { id } };
    }
  }
}

// ---------------------------------------------------------------------------
// DataProvider export
// ---------------------------------------------------------------------------

export const fleetcoreDataProvider = {
  getApiUrl: () => API_URL,
  getList,
  getOne,
  create,
  update,
  deleteOne,
} as DataProvider;
