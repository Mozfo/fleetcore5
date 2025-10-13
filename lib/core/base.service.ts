/**
 * Base Service Abstract Class
 * Provides transaction support and error handling for all services
 */

import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PrismaTransaction } from "@/lib/core/types";
import { isPrismaError } from "@/lib/core/errors";
import { logger } from "@/lib/logger";

export abstract class BaseService {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Execute an operation within a database transaction
   */
  protected async executeInTransaction<T>(
    operation: (tx: PrismaTransaction) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  /**
   * Handle errors consistently across all services
   */
  protected handleError(error: unknown, context: string): never {
    logger.error({ error, context }, `Error in ${context}`);

    // Handle Prisma-specific errors with type guard
    if (isPrismaError(error)) {
      if (error.code === "P2002") {
        throw new Error(`Duplicate entry in ${context}`);
      }

      if (error.code === "P2025") {
        throw new Error(`Record not found in ${context}`);
      }
    }

    // Re-throw the original error with context
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Operation failed in ${context}: ${message}`);
  }
}
