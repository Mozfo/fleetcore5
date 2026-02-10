/**
 * Blacklist Repository - V6.6
 *
 * Data access layer for crm_blacklist table.
 * Simple repository (no BaseRepository) since crm_blacklist
 * has no soft-delete/audit columns.
 *
 * @module lib/repositories/crm/blacklist.repository
 */

import type { PrismaClient, crm_blacklist } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

// ===== TYPES =====

export type Blacklist = crm_blacklist;

export interface CreateBlacklistInput {
  provider_id: string;
  email: string;
  reason: string;
  reason_comment?: string | null;
  original_lead_id?: string | null;
  blacklisted_by?: string | null;
}

// ===== REPOSITORY CLASS =====

export class BlacklistRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  /**
   * Find active blacklist entry by email and provider
   * Ignores entries that have been removed (removed_at IS NULL)
   */
  async findByEmail(
    email: string,
    providerId: string
  ): Promise<crm_blacklist | null> {
    return this.prisma.crm_blacklist.findFirst({
      where: {
        email: { equals: email.toLowerCase().trim(), mode: "insensitive" },
        provider_id: providerId,
        removed_at: null,
      },
    });
  }

  /**
   * Get all active blacklist entries for a provider
   */
  async findByProvider(providerId: string): Promise<crm_blacklist[]> {
    return this.prisma.crm_blacklist.findMany({
      where: {
        provider_id: providerId,
        removed_at: null,
      },
      orderBy: { blacklisted_at: "desc" },
    });
  }

  /**
   * Create a new blacklist entry
   */
  async create(data: CreateBlacklistInput): Promise<crm_blacklist> {
    return this.prisma.crm_blacklist.create({
      data: {
        provider_id: data.provider_id,
        email: data.email.toLowerCase().trim(),
        reason: data.reason,
        reason_comment: data.reason_comment || null,
        original_lead_id: data.original_lead_id || null,
        blacklisted_by: data.blacklisted_by || null,
        blacklisted_at: new Date(),
      },
    });
  }

  /**
   * Soft-remove a blacklist entry (set removed_at + removed_by)
   */
  async softRemove(id: string, removedBy: string): Promise<crm_blacklist> {
    return this.prisma.crm_blacklist.update({
      where: { id },
      data: {
        removed_at: new Date(),
        removed_by: removedBy,
      },
    });
  }
}
