"use server";

/**
 * CRM Agreement Server Actions
 *
 * Server Actions for agreement (contract) lifecycle management in Quote-to-Cash flow.
 * All actions require admin authentication.
 *
 * Security:
 * 1. All actions require requireCrmAuth (HQ org check)
 * 2. Provider isolation via getCurrentProviderId()
 * 3. All inputs validated with Zod schemas
 *
 * Action Categories:
 * - CRUD: createAgreement, updateAgreement, deleteAgreement
 * - Signature Workflow: sendForSignature, recordClientSignature, recordProviderSignature, activate
 * - Lifecycle: terminate, createNewVersion
 * - Queries: getAgreement, getWithRelations, list, byOrder, expiringSoon
 * - Stats: getAgreementStats
 *
 * NOTE: All actions are ADMIN-only.
 * Future: Public client signature via token could be added.
 *
 * @module lib/actions/crm/agreements.actions
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuditLogUuids } from "@/lib/utils/audit-resolver";
import { getCurrentProviderId } from "@/lib/utils/provider-context";
import { agreementService } from "@/lib/services/crm/agreement.service";
import {
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} from "@/lib/core/errors";
import {
  CreateAgreementSchema,
  UpdateAgreementSchema,
  RecordClientSignatureSchema,
  RecordProviderSignatureSchema,
  TerminateAgreementSchema,
  DeleteAgreementSchema,
  CreateNewVersionSchema,
  AgreementQuerySchema,
  type CreateAgreementInput,
  type UpdateAgreementInput,
  type RecordClientSignatureInput,
  type RecordProviderSignatureInput,
  type TerminateAgreementInput,
  type DeleteAgreementInput,
  type CreateNewVersionInput,
  type AgreementQueryInput,
  type AgreementType,
  type AgreementStatus,
} from "@/lib/validators/crm/agreement.validators";
import type {
  Agreement,
  AgreementWithRelations,
} from "@/lib/repositories/crm/agreement.repository";
import type { SendForSignatureResult } from "@/lib/services/crm/agreement.service";

// =============================================================================
// INLINE SCHEMAS (not in validators)
// =============================================================================

const UuidSchema = z.string().uuid("Invalid ID format");
const DaysSchema = z.number().int().min(1).max(365).default(30);

// =============================================================================
// RESULT TYPES
// =============================================================================

/** Result for creating an agreement */
export type CreateAgreementResult =
  | { success: true; agreement: Agreement }
  | { success: false; error: string };

/** Result for updating an agreement */
export type UpdateAgreementResult =
  | { success: true; agreement: Agreement }
  | { success: false; error: string };

/** Result for deleting an agreement */
export type DeleteAgreementResult =
  | { success: true }
  | { success: false; error: string };

/** Result for sending for signature */
export type SendForSignatureActionResult =
  | { success: true; data: SendForSignatureResult }
  | { success: false; error: string };

/** Result for recording signature */
export type RecordSignatureResult =
  | { success: true; agreement: Agreement }
  | { success: false; error: string };

/** Result for activating an agreement */
export type ActivateAgreementResult =
  | { success: true; agreement: Agreement }
  | { success: false; error: string };

/** Result for terminating an agreement */
export type TerminateAgreementResult =
  | { success: true; agreement: Agreement }
  | { success: false; error: string };

/** Result for creating new version */
export type CreateNewVersionResult =
  | { success: true; agreement: Agreement }
  | { success: false; error: string };

/** Result for getting a single agreement */
export type GetAgreementResult =
  | { success: true; agreement: Agreement | null }
  | { success: false; error: string };

/** Result for getting agreement with relations */
export type GetAgreementWithRelationsResult =
  | { success: true; agreement: AgreementWithRelations | null }
  | { success: false; error: string };

/** Result for listing agreements */
export type ListAgreementsResult =
  | {
      success: true;
      agreements: Agreement[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }
  | { success: false; error: string };

/** Result for getting agreements array */
export type GetAgreementsArrayResult =
  | { success: true; agreements: Agreement[] }
  | { success: false; error: string };

/** Result for agreement stats */
export type GetAgreementStatsResult =
  | {
      success: true;
      stats: {
        byStatus: Partial<Record<AgreementStatus, number>>;
        byType: Partial<Record<AgreementType, number>>;
        averageTimeToSignature: number | null;
      };
    }
  | { success: false; error: string };

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check admin authorization
 * Returns error message if not authorized, context if OK
 */
async function checkAdminAuth(): Promise<
  { userId: string; orgId: string; providerId: string } | { error: string }
> {
  try {
    const { userId, orgId } = await requireCrmAuth();

    const providerId = await getCurrentProviderId();
    if (!providerId) {
      return { error: "Provider context required" };
    }

    return { userId, orgId, providerId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return { error: message };
  }
}

// =============================================================================
// CRUD ACTIONS (Admin Only)
// =============================================================================

/**
 * Create an agreement linked to an order
 *
 * @param input - Agreement creation data
 * @returns Created agreement or error
 */
export async function createAgreementAction(
  input: CreateAgreementInput
): Promise<CreateAgreementResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = CreateAgreementSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Create agreement via service
    const agreement = await agreementService.createAgreement({
      orderId: validated.orderId,
      providerId,
      userId,
      agreementType: validated.agreementType,
      effectiveDate: validated.effectiveDate ?? undefined,
      expiryDate: validated.expiryDate ?? undefined,
      signatureMethod: validated.signatureMethod,
      signatureProvider: validated.signatureProvider ?? undefined,
      clientSignatoryName: validated.clientSignatoryName ?? undefined,
      clientSignatoryEmail: validated.clientSignatoryEmail ?? undefined,
      clientSignatoryTitle: validated.clientSignatoryTitle ?? undefined,
      providerSignatoryId: validated.providerSignatoryId ?? undefined,
      documentUrl: validated.documentUrl ?? undefined,
      termsVersion: validated.termsVersion ?? undefined,
      governingLaw: validated.governingLaw ?? undefined,
      jurisdiction: validated.jurisdiction ?? undefined,
      internalNotes: validated.internalNotes ?? undefined,
    });

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: agreement.id,
          action: "CREATE",
          new_values: {
            agreement_reference: agreement.agreement_reference,
            order_id: validated.orderId,
            agreement_type: validated.agreementType,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info(
      {
        agreementId: agreement.id,
        agreementReference: agreement.agreement_reference,
        orderId: validated.orderId,
        agreementType: validated.agreementType,
        userId,
      },
      "[createAgreementAction] Agreement created"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error({ error }, "[createAgreementAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create agreement";
    return { success: false, error: errorMessage };
  }
}

/**
 * Update an agreement (draft status only)
 *
 * @param agreementId - Agreement UUID
 * @param input - Update data
 * @returns Updated agreement or error
 */
export async function updateAgreementAction(
  agreementId: string,
  input: UpdateAgreementInput
): Promise<UpdateAgreementResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate UUID
    const idValidation = UuidSchema.safeParse(agreementId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid agreement ID" };
    }

    // 3. Validate input
    const validation = UpdateAgreementSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 4. Update via service
    const agreement = await agreementService.updateAgreement(
      agreementId,
      providerId,
      userId,
      {
        effectiveDate: validated.effectiveDate ?? undefined,
        expiryDate: validated.expiryDate ?? undefined,
        signatureMethod: validated.signatureMethod,
        signatureProvider: validated.signatureProvider ?? undefined,
        clientSignatoryName: validated.clientSignatoryName ?? undefined,
        clientSignatoryEmail: validated.clientSignatoryEmail ?? undefined,
        clientSignatoryTitle: validated.clientSignatoryTitle ?? undefined,
        providerSignatoryId: validated.providerSignatoryId ?? undefined,
        documentUrl: validated.documentUrl ?? undefined,
        termsVersion: validated.termsVersion ?? undefined,
        governingLaw: validated.governingLaw ?? undefined,
        jurisdiction: validated.jurisdiction ?? undefined,
        internalNotes: validated.internalNotes ?? undefined,
      }
    );

    // 5. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: agreementId,
          action: "UPDATE",
          new_values: { updated_fields: Object.keys(validated) },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 6. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      { agreementId, userId, updatedFields: Object.keys(validated) },
      "[updateAgreementAction] Agreement updated"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, agreementId }, "[updateAgreementAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update agreement";
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete an agreement (soft delete, draft status only)
 *
 * @param input - Delete input with agreementId and reason
 * @returns Success or error
 */
export async function deleteAgreementAction(
  input: DeleteAgreementInput
): Promise<DeleteAgreementResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = DeleteAgreementSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Delete via service
    await agreementService.deleteAgreement(
      validated.agreementId,
      providerId,
      userId,
      validated.reason
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: validated.agreementId,
          action: "DELETE",
          new_values: { reason: validated.reason },
          severity: "warning",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      { agreementId: validated.agreementId, userId, reason: validated.reason },
      "[deleteAgreementAction] Agreement deleted"
    );

    return { success: true };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[deleteAgreementAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete agreement";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// SIGNATURE WORKFLOW ACTIONS (Admin Only)
// =============================================================================

/**
 * Send an agreement for signature
 *
 * @param agreementId - Agreement UUID
 * @returns Send result with public token or error
 */
export async function sendForSignatureAction(
  agreementId: string
): Promise<SendForSignatureActionResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate UUID
    const idValidation = UuidSchema.safeParse(agreementId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid agreement ID" };
    }

    // 3. Send via service
    const result = await agreementService.sendForSignature(
      agreementId,
      providerId,
      userId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: agreementId,
          action: "SEND_FOR_SIGNATURE",
          new_values: {
            sent_at: result.sentAt.toISOString(),
            has_public_token: !!result.publicToken,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      { agreementId, userId, sentAt: result.sentAt },
      "[sendForSignatureAction] Agreement sent for signature"
    );

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, agreementId }, "[sendForSignatureAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send for signature";
    return { success: false, error: errorMessage };
  }
}

/**
 * Record client signature
 *
 * @param input - Client signature data
 * @returns Updated agreement or error
 */
export async function recordClientSignatureAction(
  input: RecordClientSignatureInput
): Promise<RecordSignatureResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = RecordClientSignatureSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Record via service
    const agreement = await agreementService.recordClientSignature(
      validated.agreementId,
      providerId,
      {
        signatoryName: validated.signatoryName,
        signatoryEmail: validated.signatoryEmail,
        signatoryTitle: validated.signatoryTitle ?? undefined,
        signatureIp: validated.signatureIp ?? undefined,
      },
      userId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: validated.agreementId,
          action: "RECORD_CLIENT_SIGNATURE",
          new_values: {
            signatory_name: validated.signatoryName,
            signatory_email: validated.signatoryEmail,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      {
        agreementId: validated.agreementId,
        signatoryName: validated.signatoryName,
        userId,
      },
      "[recordClientSignatureAction] Client signature recorded"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[recordClientSignatureAction] Error");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to record client signature";
    return { success: false, error: errorMessage };
  }
}

/**
 * Record provider signature
 *
 * @param input - Provider signature data
 * @returns Updated agreement or error
 */
export async function recordProviderSignatureAction(
  input: RecordProviderSignatureInput
): Promise<RecordSignatureResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = RecordProviderSignatureSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Record via service
    const agreement = await agreementService.recordProviderSignature(
      validated.agreementId,
      providerId,
      {
        signatoryId: validated.signatoryId,
        signatoryName: validated.signatoryName ?? undefined,
        signatoryTitle: validated.signatoryTitle ?? undefined,
      },
      userId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: validated.agreementId,
          action: "RECORD_PROVIDER_SIGNATURE",
          new_values: { signatory_id: validated.signatoryId },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      {
        agreementId: validated.agreementId,
        signatoryId: validated.signatoryId,
        userId,
      },
      "[recordProviderSignatureAction] Provider signature recorded"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[recordProviderSignatureAction] Error");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to record provider signature";
    return { success: false, error: errorMessage };
  }
}

/**
 * Activate an agreement after both parties have signed
 *
 * @param agreementId - Agreement UUID
 * @param signedDocumentUrl - Optional URL to signed document
 * @returns Activated agreement or error
 */
export async function activateAgreementAction(
  agreementId: string,
  signedDocumentUrl?: string
): Promise<ActivateAgreementResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate UUID
    const idValidation = UuidSchema.safeParse(agreementId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid agreement ID" };
    }

    // 3. Activate via service
    const agreement = await agreementService.activateAgreement(
      agreementId,
      providerId,
      userId,
      signedDocumentUrl
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: agreementId,
          action: "ACTIVATE",
          new_values: {
            agreement_reference: agreement.agreement_reference,
            effective_date: agreement.effective_date?.toISOString(),
            expiry_date: agreement.expiry_date?.toISOString(),
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");
    revalidatePath("/[locale]/(app)/crm/orders", "page");

    logger.info(
      {
        agreementId,
        agreementReference: agreement.agreement_reference,
        userId,
      },
      "[activateAgreementAction] Agreement activated"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, agreementId }, "[activateAgreementAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to activate agreement";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// LIFECYCLE ACTIONS (Admin Only)
// =============================================================================

/**
 * Terminate an active agreement
 *
 * @param input - Termination input with agreementId and reason
 * @returns Terminated agreement or error
 */
export async function terminateAgreementAction(
  input: TerminateAgreementInput
): Promise<TerminateAgreementResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = TerminateAgreementSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Terminate via service
    const agreement = await agreementService.terminateAgreement(
      validated.agreementId,
      providerId,
      userId,
      validated.reason
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: validated.agreementId,
          action: "TERMINATE",
          new_values: { reason: validated.reason },
          severity: "warning",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      { agreementId: validated.agreementId, userId, reason: validated.reason },
      "[terminateAgreementAction] Agreement terminated"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    if (error instanceof BusinessRuleError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[terminateAgreementAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to terminate agreement";
    return { success: false, error: errorMessage };
  }
}

/**
 * Create a new version of an existing agreement
 *
 * Original agreement is marked as superseded.
 *
 * @param input - Input with originalAgreementId
 * @returns New agreement version or error
 */
export async function createNewVersionAction(
  input: CreateNewVersionInput
): Promise<CreateNewVersionResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { userId, orgId, providerId } = authResult;

    // 2. Validate input
    const validation = CreateNewVersionSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    const validated = validation.data;

    // 3. Create new version via service
    const agreement = await agreementService.createNewVersion(
      validated.originalAgreementId,
      providerId,
      userId
    );

    // 4. Audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);
    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_agreement",
          entity_id: agreement.id,
          action: "CREATE_VERSION",
          new_values: {
            original_agreement_id: validated.originalAgreementId,
            new_version: agreement.version_number,
            new_agreement_reference: agreement.agreement_reference,
          },
          severity: "info",
          category: "operational",
        },
      });
    }

    // 5. Revalidate
    revalidatePath("/[locale]/(app)/crm/agreements", "page");

    logger.info(
      {
        originalAgreementId: validated.originalAgreementId,
        newAgreementId: agreement.id,
        newVersion: agreement.version_number,
        userId,
      },
      "[createNewVersionAction] New agreement version created"
    );

    return { success: true, agreement };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }

    logger.error({ error, input }, "[createNewVersionAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create new version";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// QUERY ACTIONS (Admin Only)
// =============================================================================

/**
 * Get an agreement by ID
 *
 * @param agreementId - Agreement UUID
 * @returns Agreement or null
 */
export async function getAgreementAction(
  agreementId: string
): Promise<GetAgreementResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate UUID
    const idValidation = UuidSchema.safeParse(agreementId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid agreement ID" };
    }

    // 3. Get via service
    const agreement = await agreementService.getAgreement(
      agreementId,
      providerId
    );

    return { success: true, agreement };
  } catch (error) {
    logger.error({ error, agreementId }, "[getAgreementAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get agreement";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get an agreement with relations
 *
 * @param agreementId - Agreement UUID
 * @returns Agreement with relations or null
 */
export async function getAgreementWithRelationsAction(
  agreementId: string
): Promise<GetAgreementWithRelationsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate UUID
    const idValidation = UuidSchema.safeParse(agreementId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid agreement ID" };
    }

    // 3. Get via service
    const agreement = await agreementService.getAgreementWithRelations(
      agreementId,
      providerId
    );

    return { success: true, agreement };
  } catch (error) {
    logger.error(
      { error, agreementId },
      "[getAgreementWithRelationsAction] Error"
    );
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get agreement";
    return { success: false, error: errorMessage };
  }
}

/**
 * List agreements with pagination and filters
 *
 * @param query - Query parameters
 * @returns Paginated list of agreements
 */
export async function listAgreementsAction(
  query?: AgreementQueryInput
): Promise<ListAgreementsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate query
    const validation = AgreementQuerySchema.safeParse(query || {});
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid query" };
    }
    const validated = validation.data;

    // 3. Map camelCase query to snake_case filters for repository
    const result = await agreementService.listAgreements(
      providerId,
      {
        status: validated.status,
        agreement_type: validated.agreementType,
        order_id: validated.orderId,
        from_date: validated.effectiveFrom,
        to_date: validated.effectiveTo,
      },
      validated.page,
      validated.limit
    );

    return {
      success: true,
      agreements: result.data,
      total: result.total,
      page: result.page,
      pageSize: validated.limit,
      totalPages: result.totalPages,
    };
  } catch (error) {
    logger.error({ error, query }, "[listAgreementsAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list agreements";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get agreements for a specific order
 *
 * @param orderId - Order UUID
 * @returns Array of agreements
 */
export async function getAgreementsByOrderAction(
  orderId: string
): Promise<GetAgreementsArrayResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate UUID
    const idValidation = UuidSchema.safeParse(orderId);
    if (!idValidation.success) {
      return { success: false, error: "Invalid order ID" };
    }

    // 3. Get via service
    const agreements = await agreementService.getAgreementsByOrder(
      orderId,
      providerId
    );

    return { success: true, agreements };
  } catch (error) {
    logger.error({ error, orderId }, "[getAgreementsByOrderAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get agreements";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get agreements expiring within a number of days
 *
 * @param days - Number of days (default 30)
 * @returns Array of expiring agreements
 */
export async function getExpiringAgreementsAction(
  days?: number
): Promise<GetAgreementsArrayResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Validate days
    const daysValidation = DaysSchema.safeParse(days);
    if (!daysValidation.success) {
      return { success: false, error: "Days must be between 1 and 365" };
    }

    // 3. Get via service
    const agreements = await agreementService.getExpiringSoonAgreements(
      providerId,
      daysValidation.data
    );

    return { success: true, agreements };
  } catch (error) {
    logger.error({ error, days }, "[getExpiringAgreementsAction] Error");
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to get expiring agreements";
    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// STATS ACTIONS (Admin Only)
// =============================================================================

/**
 * Get agreement statistics
 *
 * @returns Stats by status, by type, and average time to signature
 */
export async function getAgreementStatsAction(): Promise<GetAgreementStatsResult> {
  try {
    // 1. Admin auth check
    const authResult = await checkAdminAuth();
    if ("error" in authResult) {
      return { success: false, error: authResult.error };
    }
    const { providerId } = authResult;

    // 2. Get stats via service
    const [byStatus, byType, averageTimeToSignature] = await Promise.all([
      agreementService.countByStatus(providerId),
      agreementService.countByType(providerId),
      agreementService.getAverageTimeToSignature(providerId),
    ]);

    return {
      success: true,
      stats: {
        byStatus,
        byType,
        averageTimeToSignature,
      },
    };
  } catch (error) {
    logger.error({ error }, "[getAgreementStatsAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get agreement stats";
    return { success: false, error: errorMessage };
  }
}
