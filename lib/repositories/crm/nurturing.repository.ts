/**
 * Nurturing Repository - V6.6
 *
 * Data access layer for crm_nurturing table.
 * Simple repository (no BaseRepository) since crm_nurturing
 * has no soft-delete/audit columns.
 *
 * @module lib/repositories/crm/nurturing.repository
 */

import type { PrismaClient, crm_nurturing } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

// ===== TYPES =====

export type Nurturing = crm_nurturing;

export interface CreateNurturingInput {
  provider_id: string;
  email: string;
  country_code: string;
  email_verified_at: Date;
  language?: string;
  resume_token?: string | null;
  resume_token_expires_at?: Date | null;
  original_lead_id?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  ip_address?: string | null;
  detected_country_code?: string | null;
}

// ===== REPOSITORY CLASS =====

export class NurturingRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  /**
   * Find nurturing entry by email and provider
   */
  async findByEmail(
    email: string,
    providerId: string
  ): Promise<crm_nurturing | null> {
    return this.prisma.crm_nurturing.findFirst({
      where: {
        email: { equals: email.toLowerCase().trim(), mode: "insensitive" },
        provider_id: providerId,
        archived_at: null,
      },
    });
  }

  /**
   * Find nurturing entry by resume token
   */
  async findByResumeToken(token: string): Promise<crm_nurturing | null> {
    return this.prisma.crm_nurturing.findFirst({
      where: {
        resume_token: token,
        archived_at: null,
        resume_token_expires_at: { gte: new Date() },
      },
    });
  }

  /**
   * Find entries eligible for a nurturing step
   *
   * Step 1 (J+1): nurturing_step=0 AND created_at <= NOW() - 24h
   * Step 2 (J+7): nurturing_step=1 AND last_nurturing_at <= NOW() - 6 days
   */
  async findEligibleForStep(
    step: number,
    providerId: string
  ): Promise<crm_nurturing[]> {
    const now = new Date();

    if (step === 1) {
      // J+1: Created at least 24h ago, no email sent yet
      const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return this.prisma.crm_nurturing.findMany({
        where: {
          provider_id: providerId,
          nurturing_step: 0,
          created_at: { lte: threshold },
          archived_at: null,
        },
      });
    }

    if (step === 2) {
      // J+7: Step 1 sent at least 6 days ago (J+1 + 6 = J+7)
      const threshold = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      return this.prisma.crm_nurturing.findMany({
        where: {
          provider_id: providerId,
          nurturing_step: 1,
          last_nurturing_at: { lte: threshold },
          archived_at: null,
        },
      });
    }

    return [];
  }

  /**
   * Find entries eligible for archiving
   * nurturing_step=2 AND last_nurturing_at <= NOW() - 24h
   */
  async findEligibleForArchive(providerId: string): Promise<crm_nurturing[]> {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.crm_nurturing.findMany({
      where: {
        provider_id: providerId,
        nurturing_step: 2,
        last_nurturing_at: { lte: threshold },
        archived_at: null,
      },
    });
  }

  /**
   * Create a new nurturing entry
   */
  async create(data: CreateNurturingInput): Promise<crm_nurturing> {
    return this.prisma.crm_nurturing.create({
      data: {
        provider_id: data.provider_id,
        email: data.email.toLowerCase().trim(),
        country_code: data.country_code,
        email_verified_at: data.email_verified_at,
        language: data.language || "en",
        resume_token: data.resume_token || null,
        resume_token_expires_at: data.resume_token_expires_at || null,
        original_lead_id: data.original_lead_id || null,
        nurturing_step: 0,
        source: data.source || null,
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        ip_address: data.ip_address || null,
        detected_country_code: data.detected_country_code || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Update nurturing step and last_nurturing_at
   */
  async updateNurturingStep(id: string, step: number): Promise<crm_nurturing> {
    return this.prisma.crm_nurturing.update({
      where: { id },
      data: {
        nurturing_step: step,
        last_nurturing_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Mark nurturing email as clicked
   */
  async markClicked(id: string): Promise<crm_nurturing> {
    return this.prisma.crm_nurturing.update({
      where: { id },
      data: {
        nurturing_clicked_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  /**
   * Archive a nurturing entry
   */
  async archive(id: string): Promise<crm_nurturing> {
    return this.prisma.crm_nurturing.update({
      where: { id },
      data: {
        archived_at: new Date(),
        updated_at: new Date(),
      },
    });
  }
}
