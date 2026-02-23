/**
 * Agreement Repository - CRM Agreement Data Access
 *
 * Repository for managing CRM agreements (contrats).
 * Multi-division isolation via tenant_id column.
 *
 * @module lib/repositories/crm/agreement.repository
 */

import { BaseRepository } from "@/lib/core/base.repository";
import {
  PrismaClient,
  crm_agreements,
  Prisma,
  agreement_type,
  agreement_status,
  signature_method,
} from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PrismaTransaction } from "@/lib/core/types";
import type { PaginatedResult } from "@/lib/core/types";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Whitelist of fields allowed for sorting agreements.
 */
export const AGREEMENT_SORT_FIELDS = [
  "id",
  "agreement_reference",
  "agreement_type",
  "version_number",
  "status",
  "effective_date",
  "expiry_date",
  "signature_method",
  "client_signed_at",
  "provider_signed_at",
  "created_at",
  "updated_at",
  "sent_for_signature_at",
] as const satisfies SortFieldWhitelist;

/**
 * Base Agreement type from Prisma
 */
export type Agreement = crm_agreements;

/**
 * Agreement with relations
 */
export type AgreementWithRelations = Agreement & {
  crm_orders?: {
    id: string;
    order_reference: string;
    status: string;
    total_value: Prisma.Decimal;
    currency: string;
  };
  parent_agreement?: {
    id: string;
    agreement_reference: string;
    version_number: number;
  } | null;
  child_agreements?: Array<{
    id: string;
    agreement_reference: string;
    version_number: number;
  }>;
  provider_signatory?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    title: string | null;
  } | null;
};

/**
 * Input type for creating a new agreement
 */
export interface AgreementCreateInput {
  order_id: string;
  tenant_id: string;
  created_by: string;
  agreement_type: agreement_type;
  effective_date?: Date;
  expiry_date?: Date;
  signature_method?: signature_method;
  signature_provider?: string;
  client_signatory_name?: string;
  client_signatory_email?: string;
  client_signatory_title?: string;
  provider_signatory_id?: string;
  document_url?: string;
  terms_version?: string;
  governing_law?: string;
  jurisdiction?: string;
  custom_clauses?: Prisma.InputJsonValue;
  internal_notes?: string;
  metadata?: Prisma.InputJsonValue;
  // Parent for versioning
  parent_agreement_id?: string;
  version_number?: number;
}

/**
 * Input type for updating an agreement
 */
export interface AgreementUpdateInput {
  status?: agreement_status;
  effective_date?: Date;
  expiry_date?: Date;
  signature_method?: signature_method;
  signature_provider?: string;
  provider_envelope_id?: string;
  provider_envelope_url?: string;
  client_signatory_name?: string;
  client_signatory_email?: string;
  client_signatory_title?: string;
  client_signed_at?: Date;
  client_signature_ip?: string;
  provider_signatory_id?: string;
  provider_signatory_name?: string;
  provider_signatory_title?: string;
  provider_signed_at?: Date;
  document_url?: string;
  signed_document_url?: string;
  terms_version?: string;
  governing_law?: string;
  jurisdiction?: string;
  custom_clauses?: Prisma.InputJsonValue;
  internal_notes?: string;
  sent_for_signature_at?: Date;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Filters for querying agreements
 */
export interface AgreementFilters {
  status?: agreement_status;
  agreement_type?: agreement_type;
  order_id?: string;
  from_date?: Date;
  to_date?: Date;
  expiring_within_days?: number;
}

// =============================================================================
// REPOSITORY
// =============================================================================

/**
 * Repository for managing CRM agreements
 *
 * Agreements are legal contracts associated with orders.
 * Multi-division isolation via tenant_id column (FleetCore France, UAE, etc.)
 *
 * @example
 * ```typescript
 * const agreement = await agreementRepository.createAgreement({
 *   order_id: "order-uuid",
 *   tenant_id: "tenant-uuid",
 *   created_by: "user-uuid",
 *   agreement_type: "msa",
 *   effective_date: new Date("2025-02-01"),
 * });
 * // Creates agreement AGR-2025-00001
 * ```
 */
export class AgreementRepository extends BaseRepository<Agreement> {
  constructor(prisma: PrismaClient) {
    super(prisma.crm_agreements, prisma);
  }

  /**
   * Get whitelist of fields allowed for sorting
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return AGREEMENT_SORT_FIELDS;
  }

  // ===========================================================================
  // REFERENCE GENERATION
  // ===========================================================================

  /**
   * Generate a unique agreement reference for the given year
   * Format: AGR-YYYY-NNNNN (e.g., AGR-2025-00001)
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction
   * @returns Next available unique agreement reference
   */
  async generateAgreementReference(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    const model = tx ? tx.crm_agreements : this.model;
    const prefix = `AGR-${year}-`;

    const lastAgreement = await model.findFirst({
      where: {
        agreement_reference: { startsWith: prefix },
        deleted_at: null,
      },
      orderBy: { agreement_reference: "desc" },
      select: { agreement_reference: true },
    });

    let nextSequence = 1;
    if (lastAgreement?.agreement_reference) {
      const parts = lastAgreement.agreement_reference.split("-");
      if (parts.length === 3) {
        const currentSeq = parseInt(parts[2], 10);
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1;
        }
      }
    }

    return `${prefix}${nextSequence.toString().padStart(5, "0")}`;
  }

  /**
   * Generate a secure public token for agreement access
   * @returns 64-character hex token
   */
  generatePublicToken(): string {
    return randomBytes(32).toString("hex");
  }

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Create a new agreement with auto-generated reference
   *
   * @param data - Agreement creation input
   * @param tx - Optional Prisma transaction
   * @returns Created agreement
   */
  async createAgreement(
    data: AgreementCreateInput,
    tx?: PrismaTransaction
  ): Promise<Agreement> {
    const year = new Date().getFullYear();
    const model = tx ? tx.crm_agreements : this.model;

    // Generate unique reference
    const agreementReference = await this.generateAgreementReference(year, tx);

    return await model.create({
      data: {
        agreement_reference: agreementReference,
        order_id: data.order_id,
        tenant_id: data.tenant_id,
        created_by: data.created_by,
        updated_by: data.created_by,
        agreement_type: data.agreement_type,
        version_number: data.version_number ?? 1,
        parent_agreement_id: data.parent_agreement_id,
        status: "draft",
        effective_date: data.effective_date,
        expiry_date: data.expiry_date,
        signature_method: data.signature_method ?? "electronic",
        signature_provider: data.signature_provider,
        client_signatory_name: data.client_signatory_name,
        client_signatory_email: data.client_signatory_email,
        client_signatory_title: data.client_signatory_title,
        provider_signatory_id: data.provider_signatory_id,
        document_url: data.document_url,
        terms_version: data.terms_version,
        governing_law: data.governing_law,
        jurisdiction: data.jurisdiction,
        custom_clauses: data.custom_clauses ?? Prisma.JsonNull,
        internal_notes: data.internal_notes,
        metadata: data.metadata ?? Prisma.JsonNull,
      },
    });
  }

  /**
   * Find an agreement by ID with tenant filtering
   */
  async findByIdWithProvider(
    id: string,
    tenantId: string
  ): Promise<Agreement | null> {
    return await this.model.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
  }

  /**
   * Find an agreement by reference
   */
  async findByReference(
    reference: string,
    tenantId: string
  ): Promise<Agreement | null> {
    return await this.model.findFirst({
      where: {
        agreement_reference: reference,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
  }

  /**
   * Find an agreement with all relations
   */
  async findWithRelations(
    id: string,
    tenantId: string
  ): Promise<AgreementWithRelations | null> {
    return await this.model.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        crm_orders: {
          select: {
            id: true,
            order_reference: true,
            status: true,
            total_value: true,
            currency: true,
          },
        },
        parent_agreement: {
          select: {
            id: true,
            agreement_reference: true,
            version_number: true,
          },
        },
        child_agreements: {
          where: { deleted_at: null },
          select: {
            id: true,
            agreement_reference: true,
            version_number: true,
          },
        },
        provider_signatory: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Update an agreement
   */
  async updateAgreement(
    id: string,
    tenantId: string,
    data: AgreementUpdateInput,
    userId: string
  ): Promise<Agreement> {
    // Use UncheckedUpdateInput to access provider_signatory_id directly
    const updateData: Prisma.crm_agreementsUncheckedUpdateInput = {
      updated_by: userId,
      updated_at: new Date(),
    };

    // Only include fields that are defined
    if (data.status !== undefined) updateData.status = data.status;
    if (data.effective_date !== undefined)
      updateData.effective_date = data.effective_date;
    if (data.expiry_date !== undefined)
      updateData.expiry_date = data.expiry_date;
    if (data.signature_method !== undefined)
      updateData.signature_method = data.signature_method;
    if (data.signature_provider !== undefined)
      updateData.signature_provider = data.signature_provider;
    if (data.provider_envelope_id !== undefined)
      updateData.provider_envelope_id = data.provider_envelope_id;
    if (data.provider_envelope_url !== undefined)
      updateData.provider_envelope_url = data.provider_envelope_url;
    if (data.client_signatory_name !== undefined)
      updateData.client_signatory_name = data.client_signatory_name;
    if (data.client_signatory_email !== undefined)
      updateData.client_signatory_email = data.client_signatory_email;
    if (data.client_signatory_title !== undefined)
      updateData.client_signatory_title = data.client_signatory_title;
    if (data.client_signed_at !== undefined)
      updateData.client_signed_at = data.client_signed_at;
    if (data.client_signature_ip !== undefined)
      updateData.client_signature_ip = data.client_signature_ip;
    if (data.provider_signatory_id !== undefined)
      updateData.provider_signatory_id = data.provider_signatory_id;
    if (data.provider_signatory_name !== undefined)
      updateData.provider_signatory_name = data.provider_signatory_name;
    if (data.provider_signatory_title !== undefined)
      updateData.provider_signatory_title = data.provider_signatory_title;
    if (data.provider_signed_at !== undefined)
      updateData.provider_signed_at = data.provider_signed_at;
    if (data.document_url !== undefined)
      updateData.document_url = data.document_url;
    if (data.signed_document_url !== undefined)
      updateData.signed_document_url = data.signed_document_url;
    if (data.terms_version !== undefined)
      updateData.terms_version = data.terms_version;
    if (data.governing_law !== undefined)
      updateData.governing_law = data.governing_law;
    if (data.jurisdiction !== undefined)
      updateData.jurisdiction = data.jurisdiction;
    if (data.custom_clauses !== undefined)
      updateData.custom_clauses = data.custom_clauses;
    if (data.internal_notes !== undefined)
      updateData.internal_notes = data.internal_notes;
    if (data.sent_for_signature_at !== undefined)
      updateData.sent_for_signature_at = data.sent_for_signature_at;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: updateData,
    });
  }

  /**
   * Soft delete an agreement
   */
  async softDeleteAgreement(
    id: string,
    tenantId: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        deleted_by: deletedBy,
        deletion_reason: reason,
      },
    });
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Find agreements by order
   */
  async findByOrder(orderId: string, tenantId: string): Promise<Agreement[]> {
    return await this.model.findMany({
      where: {
        order_id: orderId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find agreements by type
   */
  async findByType(
    agreementType: agreement_type,
    tenantId: string
  ): Promise<Agreement[]> {
    return await this.model.findMany({
      where: {
        agreement_type: agreementType,
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find agreements by status
   */
  async findByStatus(
    status: agreement_status,
    tenantId: string
  ): Promise<Agreement[]> {
    return await this.model.findMany({
      where: {
        status,
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * Find agreements pending signature
   */
  async findPendingSignature(tenantId: string): Promise<Agreement[]> {
    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ["pending_signature", "pending_review"] },
        deleted_at: null,
      },
      orderBy: { sent_for_signature_at: "asc" },
    });
  }

  /**
   * Find agreements expiring within N days
   */
  async findExpiringSoon(tenantId: string, days: number): Promise<Agreement[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ["signed", "active"] },
        expiry_date: {
          gte: now,
          lte: futureDate,
        },
        deleted_at: null,
      },
      orderBy: { expiry_date: "asc" },
    });
  }

  /**
   * Find expired agreements
   */
  async findExpired(tenantId: string): Promise<Agreement[]> {
    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ["signed", "active"] },
        expiry_date: { lt: new Date() },
        deleted_at: null,
      },
      orderBy: { expiry_date: "asc" },
    });
  }

  /**
   * Find all agreements with pagination and filters
   */
  async findAllWithFilters(
    tenantId: string,
    filters: AgreementFilters = {},
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Agreement>> {
    const where: Prisma.crm_agreementsWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
    };

    if (filters.status) where.status = filters.status;
    if (filters.agreement_type) where.agreement_type = filters.agreement_type;
    if (filters.order_id) where.order_id = filters.order_id;
    if (filters.from_date || filters.to_date) {
      where.created_at = {
        ...(filters.from_date && { gte: filters.from_date }),
        ...(filters.to_date && { lte: filters.to_date }),
      };
    }
    if (filters.expiring_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiring_within_days);
      where.expiry_date = {
        gte: new Date(),
        lte: futureDate,
      };
    }

    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ===========================================================================
  // VERSIONING
  // ===========================================================================

  /**
   * Find all versions of an agreement (version history)
   */
  async findVersionHistory(
    parentAgreementId: string,
    tenantId: string
  ): Promise<Agreement[]> {
    return await this.model.findMany({
      where: {
        OR: [
          { id: parentAgreementId },
          { parent_agreement_id: parentAgreementId },
        ],
        tenant_id: tenantId,
        deleted_at: null,
      },
      orderBy: { version_number: "asc" },
    });
  }

  /**
   * Create a new version of an existing agreement
   */
  async createNewVersion(
    agreementId: string,
    tenantId: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Agreement> {
    const model = tx ? tx.crm_agreements : this.model;

    const existingAgreement = await model.findFirst({
      where: {
        id: agreementId,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });

    if (!existingAgreement) {
      throw new Error(`Agreement not found: ${agreementId}`);
    }

    const newVersion = existingAgreement.version_number + 1;

    // Extract custom_clauses safely - use InputJsonValue | JsonNull union
    const customClauses = existingAgreement.custom_clauses;
    const customClausesValue =
      customClauses !== null
        ? (customClauses as Prisma.InputJsonValue)
        : undefined;

    return this.createAgreement(
      {
        order_id: existingAgreement.order_id,
        tenant_id: tenantId,
        created_by: userId,
        agreement_type: existingAgreement.agreement_type,
        effective_date: existingAgreement.effective_date ?? undefined,
        expiry_date: existingAgreement.expiry_date ?? undefined,
        signature_method: existingAgreement.signature_method,
        signature_provider: existingAgreement.signature_provider ?? undefined,
        client_signatory_name:
          existingAgreement.client_signatory_name ?? undefined,
        client_signatory_email:
          existingAgreement.client_signatory_email ?? undefined,
        client_signatory_title:
          existingAgreement.client_signatory_title ?? undefined,
        provider_signatory_id:
          existingAgreement.provider_signatory_id ?? undefined,
        document_url: existingAgreement.document_url ?? undefined,
        terms_version: existingAgreement.terms_version ?? undefined,
        governing_law: existingAgreement.governing_law ?? undefined,
        jurisdiction: existingAgreement.jurisdiction ?? undefined,
        custom_clauses: customClausesValue,
        internal_notes: existingAgreement.internal_notes ?? undefined,
        parent_agreement_id:
          existingAgreement.parent_agreement_id ?? existingAgreement.id,
        version_number: newVersion,
      },
      tx
    );
  }

  // ===========================================================================
  // SIGNATURE WORKFLOW
  // ===========================================================================

  /**
   * Mark agreement as sent for signature
   */
  async markSentForSignature(
    id: string,
    tenantId: string,
    userId: string,
    envelopeId?: string,
    envelopeUrl?: string
  ): Promise<Agreement> {
    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: {
        status: "pending_signature",
        sent_for_signature_at: new Date(),
        provider_envelope_id: envelopeId,
        provider_envelope_url: envelopeUrl,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Record client signature
   */
  async recordClientSignature(
    id: string,
    tenantId: string,
    signatureData: {
      signedAt: Date;
      signatureIp?: string;
      signatoryName?: string;
      signatoryEmail?: string;
      signatoryTitle?: string;
    },
    userId: string
  ): Promise<Agreement> {
    // Check if provider has already signed
    const agreement = await this.findByIdWithProvider(id, tenantId);
    const newStatus: agreement_status = agreement?.provider_signed_at
      ? "signed"
      : "pending_review";

    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: {
        status: newStatus,
        client_signed_at: signatureData.signedAt,
        client_signature_ip: signatureData.signatureIp,
        client_signatory_name: signatureData.signatoryName,
        client_signatory_email: signatureData.signatoryEmail,
        client_signatory_title: signatureData.signatoryTitle,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Record provider signature
   */
  async recordProviderSignature(
    id: string,
    tenantId: string,
    signatureData: {
      signedAt: Date;
      signatoryId: string;
      signatoryName?: string;
      signatoryTitle?: string;
    },
    userId: string
  ): Promise<Agreement> {
    // Check if client has already signed
    const agreement = await this.findByIdWithProvider(id, tenantId);
    const newStatus: agreement_status = agreement?.client_signed_at
      ? "signed"
      : "pending_review";

    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: {
        status: newStatus,
        provider_signed_at: signatureData.signedAt,
        provider_signatory_id: signatureData.signatoryId,
        provider_signatory_name: signatureData.signatoryName,
        provider_signatory_title: signatureData.signatoryTitle,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Activate an agreement (after both parties signed)
   */
  async activateAgreement(
    id: string,
    tenantId: string,
    signedDocumentUrl: string,
    userId: string
  ): Promise<Agreement> {
    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: {
        status: "active",
        signed_document_url: signedDocumentUrl,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Terminate an agreement
   */
  async terminateAgreement(
    id: string,
    tenantId: string,
    reason: string,
    userId: string
  ): Promise<Agreement> {
    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      data: {
        status: "terminated",
        internal_notes: reason,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Count agreements by status for a provider
   */
  async countByStatus(
    tenantId: string
  ): Promise<Partial<Record<agreement_status, number>>> {
    const counts: Array<{ status: agreement_status; _count: { id: number } }> =
      await this.model.groupBy({
        by: ["status"],
        where: {
          tenant_id: tenantId,
          deleted_at: null,
        },
        _count: { id: true },
      });

    const result: Partial<Record<agreement_status, number>> = {};
    for (const item of counts) {
      result[item.status] = item._count.id;
    }
    return result;
  }

  /**
   * Count agreements by type for a provider
   */
  async countByType(
    tenantId: string
  ): Promise<Partial<Record<agreement_type, number>>> {
    const counts: Array<{
      agreement_type: agreement_type;
      _count: { id: number };
    }> = await this.model.groupBy({
      by: ["agreement_type"],
      where: {
        tenant_id: tenantId,
        deleted_at: null,
      },
      _count: { id: true },
    });

    const result: Partial<Record<agreement_type, number>> = {};
    for (const item of counts) {
      result[item.agreement_type] = item._count.id;
    }
    return result;
  }

  /**
   * Get average time to signature (in days)
   */
  async getAverageTimeToSignature(tenantId: string): Promise<number | null> {
    const signedAgreements = await this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: { in: ["signed", "active"] },
        sent_for_signature_at: { not: null },
        client_signed_at: { not: null },
        deleted_at: null,
      },
      select: {
        sent_for_signature_at: true,
        client_signed_at: true,
      },
    });

    if (signedAgreements.length === 0) return null;

    let totalDays = 0;
    for (const agreement of signedAgreements) {
      if (agreement.sent_for_signature_at && agreement.client_signed_at) {
        const diff =
          agreement.client_signed_at.getTime() -
          agreement.sent_for_signature_at.getTime();
        totalDays += diff / (1000 * 60 * 60 * 24);
      }
    }

    return totalDays / signedAgreements.length;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of AgreementRepository
 */
export const agreementRepository = new AgreementRepository(prisma);
