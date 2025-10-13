/**
 * Core Type Definitions
 * PaginationOptions, PaginatedResult, etc.
 */

import { PrismaClient } from "@prisma/client";

/**
 * Type alias for Prisma transaction client
 * Used in BaseService.executeInTransaction and all service methods accepting transactions
 */
export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
