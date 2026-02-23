/**
 * Nurturing Service - V6.6
 *
 * Business logic for managing the CRM nurturing pipeline.
 * Handles leads that started the wizard but didn't complete it.
 *
 * Flow:
 * 1. Lead created (wizard_completed = false)
 * 2. Email verified → recovery notification after 1h
 * 3. No completion after 24h → migrate to crm_nurturing
 * 4. Nurturing J+1 email → J+7 email → archive
 *
 * Nurturing steps:
 * 0 = No email sent
 * 1 = J+1 email sent
 * 2 = J+7 email sent (last)
 * After step 2 + 24h → archived
 *
 * @module lib/services/crm/nurturing.service
 */

import type { PrismaClient, crm_leads, crm_nurturing } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { NurturingRepository } from "@/lib/repositories/crm/nurturing.repository";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";

// ===== CONSTANTS =====

/** Resume token length in bytes (produces 64 hex chars) */
const RESUME_TOKEN_BYTES = 32;

/** Resume token validity in days */
const RESUME_TOKEN_EXPIRY_DAYS = 30;

// ===== SERVICE CLASS =====

export class NurturingService {
  private repo: NurturingRepository;
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    const client = prismaClient || defaultPrisma;
    this.prisma = client;
    this.repo = new NurturingRepository(client);
  }

  /**
   * Create a nurturing entry from an incomplete lead
   *
   * Called when a lead has email verified but didn't complete
   * the wizard after 24h. Migrates relevant data from crm_leads
   * to crm_nurturing.
   */
  async createFromLead(lead: crm_leads): Promise<crm_nurturing> {
    const tenantId = lead.tenant_id;
    if (!tenantId) {
      throw new Error(
        `Lead ${lead.id} has no tenant_id, cannot create nurturing entry`
      );
    }

    // Check if already exists
    const existing = await this.repo.findByEmail(lead.email, tenantId);
    if (existing) {
      logger.info(
        { email: lead.email, leadId: lead.id },
        "[Nurturing] Entry already exists, skipping"
      );
      return existing;
    }

    // Generate resume token
    const resumeToken = this.generateResumeToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RESUME_TOKEN_EXPIRY_DAYS);

    const nurturing = await this.repo.create({
      tenant_id: tenantId,
      email: lead.email,
      country_code: lead.country_code || "XX",
      email_verified_at: new Date(),
      language: lead.language || "en",
      resume_token: resumeToken,
      resume_token_expires_at: expiresAt,
      original_lead_id: lead.id,
      source: lead.source,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      ip_address: lead.ip_address,
      detected_country_code: lead.detected_country_code,
    });

    logger.info(
      { id: nurturing.id, email: lead.email, leadId: lead.id },
      "[Nurturing] Created from lead"
    );

    return nurturing;
  }

  /**
   * Find a nurturing entry by resume token
   * Returns null if token is expired or entry is archived
   */
  async findByResumeToken(token: string): Promise<crm_nurturing | null> {
    return this.repo.findByResumeToken(token);
  }

  /**
   * Generate a unique resume token (64 hex chars)
   */
  generateResumeToken(): string {
    return randomBytes(RESUME_TOKEN_BYTES).toString("hex");
  }

  /**
   * Get entries eligible for a specific nurturing step
   *
   * Step 1 (J+1): created_at >= 24h ago, no email sent yet
   * Step 2 (J+7): step 1 sent >= 6 days ago
   */
  async getEligibleForStep(
    step: number,
    tenantId: string
  ): Promise<crm_nurturing[]> {
    return this.repo.findEligibleForStep(step, tenantId);
  }

  /**
   * Send a nurturing email and update the step
   *
   * Note: Actual email sending is handled by the cron route (T5).
   * This method just updates the nurturing record.
   */
  async advanceNurturingStep(id: string, step: number): Promise<crm_nurturing> {
    const updated = await this.repo.updateNurturingStep(id, step);

    logger.info({ id, step }, "[Nurturing] Step advanced");

    return updated;
  }

  /**
   * Mark a nurturing email as clicked (user clicked resume link)
   */
  async markClicked(id: string): Promise<void> {
    await this.repo.markClicked(id);

    logger.info({ id }, "[Nurturing] Email clicked");
  }

  /**
   * Archive expired nurturing entries
   *
   * Archives entries where step 2 (J+7) was sent >= 24h ago.
   * Returns the number of entries archived.
   */
  async archiveExpired(tenantId: string): Promise<number> {
    const eligible = await this.repo.findEligibleForArchive(tenantId);

    let count = 0;
    for (const entry of eligible) {
      await this.repo.archive(entry.id);
      count++;
    }

    if (count > 0) {
      logger.info({ tenantId, count }, "[Nurturing] Expired entries archived");
    }

    return count;
  }
}

// ===== SINGLETON =====

export const nurturingService = new NurturingService();
