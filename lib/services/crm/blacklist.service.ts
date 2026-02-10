/**
 * Blacklist Service - V6.6
 *
 * Business logic for managing the CRM blacklist.
 * A blacklisted email is blocked from creating new leads.
 *
 * Features:
 * - Check if email is blacklisted
 * - Add email to blacklist (with audit: who, when, why)
 * - Remove from blacklist (soft-remove with audit)
 * - List blacklisted emails per provider
 *
 * @module lib/services/crm/blacklist.service
 */

import type { PrismaClient, crm_blacklist } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { BlacklistRepository } from "@/lib/repositories/crm/blacklist.repository";
import { logger } from "@/lib/logger";

// ===== TYPES =====

export interface AddToBlacklistInput {
  providerId: string;
  email: string;
  reason: string;
  reasonComment?: string | null;
  originalLeadId?: string | null;
  blacklistedBy?: string | null;
}

// ===== SERVICE CLASS =====

export class BlacklistService {
  private repo: BlacklistRepository;

  constructor(prismaClient?: PrismaClient) {
    this.repo = new BlacklistRepository(prismaClient || defaultPrisma);
  }

  /**
   * Check if an email is blacklisted for a provider
   */
  async isBlacklisted(email: string, providerId: string): Promise<boolean> {
    const entry = await this.repo.findByEmail(email, providerId);
    return entry !== null;
  }

  /**
   * Add an email to the blacklist
   *
   * If the email is already blacklisted (active entry), returns the existing entry.
   * Normalizes email to lowercase.
   */
  async addToBlacklist(input: AddToBlacklistInput): Promise<crm_blacklist> {
    const {
      providerId,
      email,
      reason,
      reasonComment,
      originalLeadId,
      blacklistedBy,
    } = input;

    // Check if already blacklisted
    const existing = await this.repo.findByEmail(email, providerId);
    if (existing) {
      logger.info(
        { email, providerId },
        "[Blacklist] Email already blacklisted"
      );
      return existing;
    }

    const entry = await this.repo.create({
      provider_id: providerId,
      email,
      reason,
      reason_comment: reasonComment,
      original_lead_id: originalLeadId,
      blacklisted_by: blacklistedBy,
    });

    logger.info(
      { id: entry.id, email, reason, blacklistedBy },
      "[Blacklist] Email added to blacklist"
    );

    return entry;
  }

  /**
   * Remove an email from the blacklist (soft-remove)
   *
   * Sets removed_at and removed_by for audit trail.
   */
  async removeFromBlacklist(
    id: string,
    removedBy: string
  ): Promise<crm_blacklist> {
    const entry = await this.repo.softRemove(id, removedBy);

    logger.info({ id, removedBy }, "[Blacklist] Email removed from blacklist");

    return entry;
  }

  /**
   * Get all active blacklisted emails for a provider
   */
  async getBlacklist(providerId: string): Promise<crm_blacklist[]> {
    return this.repo.findByProvider(providerId);
  }
}

// ===== SINGLETON =====

export const blacklistService = new BlacklistService();
