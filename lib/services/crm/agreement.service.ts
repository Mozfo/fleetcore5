/**
 * Agreement Service - CRM Agreement Orchestration
 *
 * This service orchestrates the complete agreement (contract) workflow:
 * 1. Create agreements from orders
 * 2. Manage signature workflow (send → client signs → provider signs → active)
 * 3. Handle versioning for agreement amendments
 * 4. Batch operations for CRON jobs (reminders, expiration)
 *
 * @module lib/services/crm/agreement.service
 */

import { prisma } from "@/lib/prisma";
import {
  AgreementRepository,
  agreementRepository,
} from "@/lib/repositories/crm/agreement.repository";
import type {
  Agreement,
  AgreementWithRelations,
  AgreementUpdateInput,
  AgreementFilters,
} from "@/lib/repositories/crm/agreement.repository";
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
} from "@/lib/core/errors";
import type { PaginatedResult } from "@/lib/core/types";
import { logger } from "@/lib/logger";
import {
  agreement_status,
  agreement_type,
  signature_method,
} from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Parameters for creating an agreement
 */
export interface CreateAgreementParams {
  orderId: string;
  providerId: string;
  userId: string;
  agreementType: agreement_type;
  effectiveDate?: Date;
  expiryDate?: Date;
  signatureMethod?: signature_method;
  signatureProvider?: string;
  clientSignatoryName?: string;
  clientSignatoryEmail?: string;
  clientSignatoryTitle?: string;
  providerSignatoryId?: string;
  documentUrl?: string;
  termsVersion?: string;
  governingLaw?: string;
  jurisdiction?: string;
  internalNotes?: string;
}

/**
 * Parameters for updating an agreement
 */
export interface UpdateAgreementParams {
  effectiveDate?: Date;
  expiryDate?: Date;
  signatureMethod?: signature_method;
  signatureProvider?: string;
  clientSignatoryName?: string;
  clientSignatoryEmail?: string;
  clientSignatoryTitle?: string;
  providerSignatoryId?: string;
  documentUrl?: string;
  termsVersion?: string;
  governingLaw?: string;
  jurisdiction?: string;
  internalNotes?: string;
}

/**
 * Parameters for recording client signature
 */
export interface RecordClientSignatureParams {
  signatoryName: string;
  signatoryEmail: string;
  signatoryTitle?: string;
  signatureIp?: string;
}

/**
 * Parameters for recording provider signature
 */
export interface RecordProviderSignatureParams {
  signatoryId: string;
  signatoryName?: string;
  signatoryTitle?: string;
}

/**
 * Result of sending agreement for signature
 */
export interface SendForSignatureResult {
  agreement: Agreement;
  publicToken: string;
  sentAt: Date;
}

/**
 * Default agreement types to create for an order
 */
const DEFAULT_AGREEMENT_TYPES: agreement_type[] = ["msa"];

// =============================================================================
// ALLOWED STATUS TRANSITIONS
// =============================================================================

const ALLOWED_TRANSITIONS: Record<agreement_status, agreement_status[]> = {
  draft: ["pending_review", "pending_signature"],
  pending_review: ["pending_signature", "draft"],
  pending_signature: ["signed", "expired", "terminated"],
  signed: ["active", "terminated"],
  active: ["expired", "terminated", "superseded"],
  expired: [],
  terminated: [],
  superseded: [],
};

/**
 * Check if a status transition is allowed
 */
function isTransitionAllowed(
  from: agreement_status,
  to: agreement_status
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// =============================================================================
// SERVICE
// =============================================================================

/**
 * Agreement Service
 *
 * Orchestrates agreement creation, signature workflow, and lifecycle management.
 *
 * @example
 * ```typescript
 * // Create agreements for an order
 * const agreements = await agreementService.createAgreementsForOrder(
 *   orderId, providerId, userId, ["msa", "sla"]
 * );
 *
 * // Send for signature
 * await agreementService.sendForSignature(agreementId, providerId, userId);
 *
 * // Record signatures
 * await agreementService.recordClientSignature(agreementId, providerId, {
 *   signatoryName: "John Doe",
 *   signatoryEmail: "john@client.com"
 * }, userId);
 *
 * await agreementService.recordProviderSignature(agreementId, providerId, {
 *   signatoryId: "employee-uuid"
 * }, userId);
 *
 * // Activate
 * await agreementService.activateAgreement(agreementId, providerId, userId);
 * ```
 */
export class AgreementService {
  private agreementRepo: AgreementRepository;

  constructor() {
    this.agreementRepo = agreementRepository;
  }

  // ===========================================================================
  // CRUD
  // ===========================================================================

  /**
   * Create a new agreement
   *
   * @param params - Agreement creation parameters
   * @returns Created agreement
   * @throws {NotFoundError} If order not found
   */
  async createAgreement(params: CreateAgreementParams): Promise<Agreement> {
    const {
      orderId,
      providerId,
      userId,
      agreementType,
      effectiveDate,
      expiryDate,
      signatureMethod = "electronic",
      signatureProvider,
      clientSignatoryName,
      clientSignatoryEmail,
      clientSignatoryTitle,
      providerSignatoryId,
      documentUrl,
      termsVersion,
      governingLaw,
      jurisdiction,
      internalNotes,
    } = params;

    // Validate order exists
    const order = await prisma.crm_orders.findFirst({
      where: {
        id: orderId,
        provider_id: providerId,
        deleted_at: null,
      },
    });

    if (!order) {
      throw new NotFoundError(`Order ${orderId}`);
    }

    const agreement = await this.agreementRepo.createAgreement({
      order_id: orderId,
      provider_id: providerId,
      created_by: userId,
      agreement_type: agreementType,
      effective_date: effectiveDate,
      expiry_date: expiryDate,
      signature_method: signatureMethod,
      signature_provider: signatureProvider,
      client_signatory_name: clientSignatoryName,
      client_signatory_email: clientSignatoryEmail,
      client_signatory_title: clientSignatoryTitle,
      provider_signatory_id: providerSignatoryId,
      document_url: documentUrl,
      terms_version: termsVersion,
      governing_law: governingLaw,
      jurisdiction,
      internal_notes: internalNotes,
    });

    logger.info(
      {
        agreementId: agreement.id,
        agreementReference: agreement.agreement_reference,
        orderId,
        agreementType,
      },
      "[AgreementService] Agreement created"
    );

    return agreement;
  }

  /**
   * Update an agreement
   *
   * Only draft agreements can be updated.
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param userId - User making the update
   * @param params - Update parameters
   * @returns Updated agreement
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If agreement is not in draft status
   */
  async updateAgreement(
    id: string,
    providerId: string,
    userId: string,
    params: UpdateAgreementParams
  ): Promise<Agreement> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (agreement.status !== "draft") {
      throw new BusinessRuleError(
        "Only draft agreements can be updated",
        "agreement_not_draft",
        { currentStatus: agreement.status }
      );
    }

    const updateData: AgreementUpdateInput = {};
    if (params.effectiveDate !== undefined)
      updateData.effective_date = params.effectiveDate;
    if (params.expiryDate !== undefined)
      updateData.expiry_date = params.expiryDate;
    if (params.signatureMethod !== undefined)
      updateData.signature_method = params.signatureMethod;
    if (params.signatureProvider !== undefined)
      updateData.signature_provider = params.signatureProvider;
    if (params.clientSignatoryName !== undefined)
      updateData.client_signatory_name = params.clientSignatoryName;
    if (params.clientSignatoryEmail !== undefined)
      updateData.client_signatory_email = params.clientSignatoryEmail;
    if (params.clientSignatoryTitle !== undefined)
      updateData.client_signatory_title = params.clientSignatoryTitle;
    if (params.providerSignatoryId !== undefined)
      updateData.provider_signatory_id = params.providerSignatoryId;
    if (params.documentUrl !== undefined)
      updateData.document_url = params.documentUrl;
    if (params.termsVersion !== undefined)
      updateData.terms_version = params.termsVersion;
    if (params.governingLaw !== undefined)
      updateData.governing_law = params.governingLaw;
    if (params.jurisdiction !== undefined)
      updateData.jurisdiction = params.jurisdiction;
    if (params.internalNotes !== undefined)
      updateData.internal_notes = params.internalNotes;

    const updated = await this.agreementRepo.updateAgreement(
      id,
      providerId,
      updateData,
      userId
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        userId,
        updates: Object.keys(updateData),
      },
      "[AgreementService] Agreement updated"
    );

    return updated;
  }

  /**
   * Delete an agreement (soft delete)
   *
   * Only draft agreements can be deleted.
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param deletedBy - User making the deletion
   * @param reason - Optional deletion reason
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If agreement is not in draft status
   */
  async deleteAgreement(
    id: string,
    providerId: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (agreement.status !== "draft") {
      throw new BusinessRuleError(
        "Only draft agreements can be deleted",
        "agreement_not_draft",
        { currentStatus: agreement.status }
      );
    }

    await this.agreementRepo.softDeleteAgreement(
      id,
      providerId,
      deletedBy,
      reason
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        deletedBy,
        reason,
      },
      "[AgreementService] Agreement deleted"
    );
  }

  // ===========================================================================
  // SIGNATURE WORKFLOW
  // ===========================================================================

  /**
   * Send an agreement for signature
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param sentBy - User sending the agreement
   * @returns Send result with public token
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If agreement cannot be sent
   */
  async sendForSignature(
    id: string,
    providerId: string,
    sentBy: string
  ): Promise<SendForSignatureResult> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (agreement.status !== "draft" && agreement.status !== "pending_review") {
      throw new BusinessRuleError(
        `Cannot send agreement in ${agreement.status} status for signature`,
        "invalid_status_transition",
        { currentStatus: agreement.status }
      );
    }

    // Validate required fields
    if (!agreement.client_signatory_email) {
      throw new ValidationError(
        "Client signatory email is required to send for signature"
      );
    }

    // Generate public token
    const publicToken = this.agreementRepo.generatePublicToken();

    // Mark as sent for signature
    const updated = await this.agreementRepo.markSentForSignature(
      id,
      providerId,
      sentBy,
      undefined, // envelopeId - for DocuSign integration
      undefined // envelopeUrl - for DocuSign integration
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        sentBy,
        clientEmail: agreement.client_signatory_email,
      },
      "[AgreementService] Agreement sent for signature"
    );

    // TODO: Send notification to client via NotificationService
    // TODO: Integrate with DocuSign/HelloSign if signature_method is electronic

    return {
      agreement: updated,
      publicToken,
      sentAt: updated.sent_for_signature_at ?? new Date(),
    };
  }

  /**
   * Record client signature
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param params - Signature parameters
   * @param recordedBy - User recording the signature
   * @returns Updated agreement
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If agreement is not pending signature
   */
  async recordClientSignature(
    id: string,
    providerId: string,
    params: RecordClientSignatureParams,
    recordedBy: string
  ): Promise<Agreement> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (
      agreement.status !== "pending_signature" &&
      agreement.status !== "pending_review"
    ) {
      throw new BusinessRuleError(
        `Cannot record signature on agreement in ${agreement.status} status`,
        "invalid_status_for_signature",
        { currentStatus: agreement.status }
      );
    }

    const updated = await this.agreementRepo.recordClientSignature(
      id,
      providerId,
      {
        signedAt: new Date(),
        signatureIp: params.signatureIp,
        signatoryName: params.signatoryName,
        signatoryEmail: params.signatoryEmail,
        signatoryTitle: params.signatoryTitle,
      },
      recordedBy
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        clientSignatory: params.signatoryName,
        clientEmail: params.signatoryEmail,
        bothSigned: !!updated.provider_signed_at,
      },
      "[AgreementService] Client signature recorded"
    );

    // Auto-activate if both parties have signed
    if (updated.provider_signed_at) {
      logger.info(
        { agreementId: id },
        "[AgreementService] Both parties signed, agreement ready for activation"
      );
    }

    return updated;
  }

  /**
   * Record provider signature
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param params - Signature parameters
   * @param recordedBy - User recording the signature
   * @returns Updated agreement
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If agreement is not pending signature
   */
  async recordProviderSignature(
    id: string,
    providerId: string,
    params: RecordProviderSignatureParams,
    recordedBy: string
  ): Promise<Agreement> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (
      agreement.status !== "pending_signature" &&
      agreement.status !== "pending_review"
    ) {
      throw new BusinessRuleError(
        `Cannot record signature on agreement in ${agreement.status} status`,
        "invalid_status_for_signature",
        { currentStatus: agreement.status }
      );
    }

    const updated = await this.agreementRepo.recordProviderSignature(
      id,
      providerId,
      {
        signedAt: new Date(),
        signatoryId: params.signatoryId,
        signatoryName: params.signatoryName,
        signatoryTitle: params.signatoryTitle,
      },
      recordedBy
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        providerSignatoryId: params.signatoryId,
        bothSigned: !!updated.client_signed_at,
      },
      "[AgreementService] Provider signature recorded"
    );

    // Auto-activate if both parties have signed
    if (updated.client_signed_at) {
      logger.info(
        { agreementId: id },
        "[AgreementService] Both parties signed, agreement ready for activation"
      );
    }

    return updated;
  }

  /**
   * Activate an agreement
   *
   * Both parties must have signed.
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param activatedBy - User activating the agreement
   * @param signedDocumentUrl - Optional URL to signed document
   * @returns Activated agreement
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If both parties haven't signed
   */
  async activateAgreement(
    id: string,
    providerId: string,
    activatedBy: string,
    signedDocumentUrl?: string
  ): Promise<Agreement> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (
      agreement.status !== "signed" &&
      agreement.status !== "pending_signature"
    ) {
      throw new BusinessRuleError(
        `Cannot activate agreement in ${agreement.status} status`,
        "invalid_status_transition",
        { currentStatus: agreement.status }
      );
    }

    // Both parties must have signed
    if (!agreement.client_signed_at || !agreement.provider_signed_at) {
      throw new BusinessRuleError(
        "Both parties must sign before activation",
        "signatures_required",
        {
          clientSigned: !!agreement.client_signed_at,
          providerSigned: !!agreement.provider_signed_at,
        }
      );
    }

    const updated = await this.agreementRepo.activateAgreement(
      id,
      providerId,
      signedDocumentUrl ?? agreement.signed_document_url ?? "",
      activatedBy
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        activatedBy,
        effectiveDate: agreement.effective_date,
        expiryDate: agreement.expiry_date,
      },
      "[AgreementService] Agreement activated"
    );

    // TODO: Notify both parties via NotificationService

    return updated;
  }

  /**
   * Terminate an agreement
   *
   * @param id - Agreement UUID
   * @param providerId - Provider UUID
   * @param terminatedBy - User terminating the agreement
   * @param reason - Termination reason
   * @returns Terminated agreement
   * @throws {NotFoundError} If agreement not found
   * @throws {BusinessRuleError} If agreement cannot be terminated
   */
  async terminateAgreement(
    id: string,
    providerId: string,
    terminatedBy: string,
    reason: string
  ): Promise<Agreement> {
    const agreement = await this.agreementRepo.findByIdWithProvider(
      id,
      providerId
    );

    if (!agreement) {
      throw new NotFoundError(`Agreement ${id}`);
    }

    if (!isTransitionAllowed(agreement.status, "terminated")) {
      throw new BusinessRuleError(
        `Cannot terminate agreement in ${agreement.status} status`,
        "invalid_status_transition",
        { currentStatus: agreement.status }
      );
    }

    const updated = await this.agreementRepo.terminateAgreement(
      id,
      providerId,
      reason,
      terminatedBy
    );

    logger.info(
      {
        agreementId: id,
        agreementReference: agreement.agreement_reference,
        terminatedBy,
        reason,
      },
      "[AgreementService] Agreement terminated"
    );

    return updated;
  }

  // ===========================================================================
  // VERSIONING
  // ===========================================================================

  /**
   * Create a new version of an existing agreement
   *
   * The original agreement is marked as superseded.
   *
   * @param originalId - Original agreement UUID
   * @param providerId - Provider UUID
   * @param createdBy - User creating the new version
   * @returns New agreement version
   * @throws {NotFoundError} If original agreement not found
   */
  async createNewVersion(
    originalId: string,
    providerId: string,
    createdBy: string
  ): Promise<Agreement> {
    const original = await this.agreementRepo.findByIdWithProvider(
      originalId,
      providerId
    );

    if (!original) {
      throw new NotFoundError(`Agreement ${originalId}`);
    }

    // Create new version in transaction
    const newVersion = await prisma.$transaction(async (tx) => {
      // Create new version
      const newAgreement = await this.agreementRepo.createNewVersion(
        originalId,
        providerId,
        createdBy,
        tx
      );

      // Mark original as superseded
      await tx.crm_agreements.update({
        where: { id: originalId },
        data: {
          status: "superseded",
          updated_by: createdBy,
          updated_at: new Date(),
        },
      });

      return newAgreement;
    });

    logger.info(
      {
        originalAgreementId: originalId,
        newAgreementId: newVersion.id,
        newAgreementReference: newVersion.agreement_reference,
        version: newVersion.version_number,
        createdBy,
      },
      "[AgreementService] New agreement version created"
    );

    return newVersion;
  }

  // ===========================================================================
  // CREATE FROM ORDER
  // ===========================================================================

  /**
   * Create standard agreements for an order
   *
   * @param orderId - Order UUID
   * @param providerId - Provider UUID
   * @param createdBy - User creating the agreements
   * @param types - Agreement types to create (defaults to MSA)
   * @returns Created agreements
   */
  async createAgreementsForOrder(
    orderId: string,
    providerId: string,
    createdBy: string,
    types?: agreement_type[]
  ): Promise<Agreement[]> {
    const agreementTypes = types ?? DEFAULT_AGREEMENT_TYPES;

    // Validate order exists
    const order = await prisma.crm_orders.findFirst({
      where: {
        id: orderId,
        provider_id: providerId,
        deleted_at: null,
      },
    });

    if (!order) {
      throw new NotFoundError(`Order ${orderId}`);
    }

    const agreements: Agreement[] = [];

    for (const agreementType of agreementTypes) {
      const agreement = await this.createAgreement({
        orderId,
        providerId,
        userId: createdBy,
        agreementType,
        effectiveDate: order.effective_date ?? undefined,
        expiryDate: order.expiry_date ?? undefined,
      });
      agreements.push(agreement);
    }

    logger.info(
      {
        orderId,
        orderReference: order.order_reference,
        agreementCount: agreements.length,
        types: agreementTypes,
        createdBy,
      },
      "[AgreementService] Agreements created for order"
    );

    return agreements;
  }

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  /**
   * Get an agreement by ID
   */
  async getAgreement(
    id: string,
    providerId: string
  ): Promise<Agreement | null> {
    return this.agreementRepo.findByIdWithProvider(id, providerId);
  }

  /**
   * Get an agreement with relations
   */
  async getAgreementWithRelations(
    id: string,
    providerId: string
  ): Promise<AgreementWithRelations | null> {
    return this.agreementRepo.findWithRelations(id, providerId);
  }

  /**
   * Get an agreement by reference
   */
  async getAgreementByReference(
    reference: string,
    providerId: string
  ): Promise<Agreement | null> {
    return this.agreementRepo.findByReference(reference, providerId);
  }

  /**
   * List agreements with pagination and filters
   */
  async listAgreements(
    providerId: string,
    filters?: AgreementFilters,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Agreement>> {
    return this.agreementRepo.findAllWithFilters(
      providerId,
      filters,
      page,
      pageSize
    );
  }

  /**
   * Get agreements by order
   */
  async getAgreementsByOrder(
    orderId: string,
    providerId: string
  ): Promise<Agreement[]> {
    return this.agreementRepo.findByOrder(orderId, providerId);
  }

  /**
   * Get agreements by type
   */
  async getAgreementsByType(
    agreementType: agreement_type,
    providerId: string
  ): Promise<Agreement[]> {
    return this.agreementRepo.findByType(agreementType, providerId);
  }

  /**
   * Get agreements pending signature
   */
  async getPendingSignatureAgreements(
    providerId: string
  ): Promise<Agreement[]> {
    return this.agreementRepo.findPendingSignature(providerId);
  }

  /**
   * Get version history of an agreement
   */
  async getVersionHistory(
    agreementId: string,
    providerId: string
  ): Promise<Agreement[]> {
    return this.agreementRepo.findVersionHistory(agreementId, providerId);
  }

  // ===========================================================================
  // BATCH OPERATIONS (FOR CRON)
  // ===========================================================================

  /**
   * Send reminders for agreements pending signature
   *
   * @param providerId - Provider UUID
   * @param daysThreshold - Days since sent for signature
   * @returns Number of reminders sent
   */
  async sendSignatureReminders(
    providerId: string,
    daysThreshold: number
  ): Promise<number> {
    const pendingAgreements =
      await this.agreementRepo.findPendingSignature(providerId);

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    let sentCount = 0;

    for (const agreement of pendingAgreements) {
      if (
        agreement.sent_for_signature_at &&
        agreement.sent_for_signature_at < thresholdDate
      ) {
        // TODO: Send reminder via NotificationService
        logger.info(
          {
            agreementId: agreement.id,
            agreementReference: agreement.agreement_reference,
            sentForSignatureAt: agreement.sent_for_signature_at,
            daysPending: Math.floor(
              (Date.now() - agreement.sent_for_signature_at.getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          },
          "[AgreementService] Signature reminder would be sent"
        );
        sentCount++;
      }
    }

    logger.info(
      {
        providerId,
        remindersSent: sentCount,
        daysThreshold,
      },
      "[AgreementService] Signature reminders batch completed"
    );

    return sentCount;
  }

  /**
   * Expire agreements that have passed their expiry date
   *
   * @param providerId - Provider UUID
   * @returns Number of agreements expired
   */
  async expireOverdueAgreements(providerId: string): Promise<number> {
    const expiredAgreements = await this.agreementRepo.findExpired(providerId);

    let count = 0;
    for (const agreement of expiredAgreements) {
      try {
        await this.agreementRepo.updateAgreement(
          agreement.id,
          providerId,
          { status: "expired" },
          "system"
        );
        count++;

        logger.info(
          {
            agreementId: agreement.id,
            agreementReference: agreement.agreement_reference,
            expiryDate: agreement.expiry_date,
          },
          "[AgreementService] Agreement expired"
        );
      } catch (error) {
        logger.warn(
          {
            agreementId: agreement.id,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "[AgreementService] Failed to expire agreement"
        );
      }
    }

    logger.info(
      {
        providerId,
        expiredCount: count,
        totalFound: expiredAgreements.length,
      },
      "[AgreementService] Batch agreement expiration completed"
    );

    return count;
  }

  /**
   * Get agreements expiring soon
   */
  async getExpiringSoonAgreements(
    providerId: string,
    days: number
  ): Promise<Agreement[]> {
    return this.agreementRepo.findExpiringSoon(providerId, days);
  }

  /**
   * Count agreements by status
   */
  async countByStatus(
    providerId: string
  ): Promise<Partial<Record<agreement_status, number>>> {
    return this.agreementRepo.countByStatus(providerId);
  }

  /**
   * Count agreements by type
   */
  async countByType(
    providerId: string
  ): Promise<Partial<Record<agreement_type, number>>> {
    return this.agreementRepo.countByType(providerId);
  }

  /**
   * Get average time to signature
   */
  async getAverageTimeToSignature(providerId: string): Promise<number | null> {
    return this.agreementRepo.getAverageTimeToSignature(providerId);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton instance of AgreementService
 */
export const agreementService = new AgreementService();
