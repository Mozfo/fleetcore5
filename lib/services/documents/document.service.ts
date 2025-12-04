// Document service implementation
import { BaseService } from "@/lib/core/base.service";
import { DocumentRepository } from "./document.repository";
import { auditLog } from "@/lib/audit";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import { EmailService } from "@/lib/services/email/email.service";
import type { PrismaTransaction } from "@/lib/core/types";
import type {
  Document,
  DocumentWithMetadata,
  UploadDocumentDto,
  VerifyDocumentDto,
  DocumentTypeConfig,
  CountryDocumentRequirements,
  DocumentExpiryCheck,
  DocumentFilters,
  BatchUploadResult,
} from "./document.types";

export class DocumentService extends BaseService {
  private documentRepo: DocumentRepository;
  private emailService: EmailService;

  constructor() {
    super();
    this.documentRepo = new DocumentRepository(this.prisma);
    this.emailService = new EmailService();
  }

  /**
   * Create a placeholder document entry
   * Used by VehicleService to create required document entries
   */
  async createPlaceholder(
    entityType: string,
    entityId: string,
    documentType: string,
    tenantId: string,
    userId: string,
    tx?: PrismaTransaction
  ): Promise<Document> {
    const prismaClient = tx || this.prisma;

    // Check if document already exists
    const existing = await prismaClient.doc_documents.findFirst({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        document_type: documentType,
        tenant_id: tenantId,
      },
    });

    if (existing) {
      return existing;
    }

    // Create placeholder document
    const document = await prismaClient.doc_documents.create({
      data: {
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: entityId,
        document_type: documentType,
        file_url: "", // Empty string as placeholder
        verified: false,
        // Note: No created_by field in schema - tracked via audit log
      },
    });

    // Audit log for compliance tracking
    await auditLog({
      tenantId,
      action: "create",
      entityType: "document",
      entityId: document.id,
      snapshot: document,
      performedBy: userId,
      metadata: {
        document_type: documentType,
        entity_type: entityType,
        entity_id: entityId,
        is_placeholder: true,
      },
    });

    return document;
  }

  /**
   * Upload a document file and update the document entry
   */
  async uploadDocument(
    documentId: string,
    data: UploadDocumentDto,
    userId: string,
    tenantId: string
  ): Promise<Document> {
    const existing = await this.documentRepo.findById(documentId, tenantId);
    if (!existing) {
      throw new NotFoundError("Document");
    }

    return this.executeInTransaction(async (tx) => {
      // Phase 2: Replace placeholder with Supabase Storage upload
      const fileUrl = `https://placeholder.storage.url/${documentId}/${data.fileName}`;

      // Update document with file information
      const document = await tx.doc_documents.update({
        where: { id: documentId },
        data: {
          file_url: fileUrl,
          expiry_date: data.expiryDate || null,
          updated_at: new Date(),
        },
      });

      // Audit log
      await auditLog({
        tenantId,
        action: "update",
        entityType: "document",
        entityId: document.id,
        changes: { before: existing, after: document },
        performedBy: userId,
        metadata: {
          action: "file_upload",
          file_name: data.fileName,
          file_size: data.fileSize,
        },
      });

      // Phase 2: Add verification workflow trigger here

      return document;
    });
  }

  /**
   * Validate/verify a document
   */
  async validateDocument(
    documentId: string,
    data: VerifyDocumentDto,
    tenantId: string
  ): Promise<Document> {
    const existing = await this.documentRepo.findById(documentId, tenantId);
    if (!existing) {
      throw new NotFoundError("Document");
    }

    if (!existing.file_url) {
      throw new ValidationError("Cannot verify document without uploaded file");
    }

    const document = await this.documentRepo.updateVerificationStatus(
      documentId,
      data.verified,
      new Date(),
      tenantId
    );

    // Audit log with verifier information
    await auditLog({
      tenantId,
      action: "update",
      entityType: "document",
      entityId: document.id,
      changes: {
        before: { verified: existing.verified },
        after: { verified: document.verified },
      },
      performedBy: data.verifiedBy,
      metadata: {
        action: data.verified ? "document_verified" : "document_rejected",
        rejection_reason: data.rejectionReason,
      },
    });

    // Send notification if document was rejected
    if (!data.verified && data.rejectionReason) {
      // Admin email fallback - Phase 2: resolve from entity owner
      const adminEmail = process.env.ADMIN_EMAIL || "admin@fleetcore.app";
      await this.emailService.sendDocumentExpiryAlert(
        document,
        "Document rejected: " + data.rejectionReason,
        document.tenant_id,
        adminEmail,
        0 // 0 days = immediate action required
      );
    }

    return document;
  }

  /**
   * Get required documents by country
   * Note: Hardcoded config - Phase 2: migrate to dir_country_regulations table
   */
  async getRequiredDocumentsByCountry(
    country: string,
    entityType: "vehicle" | "driver"
  ): Promise<DocumentTypeConfig[]> {
    // Country requirements (Phase 2: migrate to database)
    const countryRequirements: Record<string, CountryDocumentRequirements> = {
      FR: {
        country: "FR",
        vehicleDocuments: [
          { type: "registration", required: true, renewable: false },
          {
            type: "insurance",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30, 15, 7],
          },
          {
            type: "professional_license",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30, 15],
          },
          {
            type: "technical_control",
            required: true,
            renewable: true,
            expiryMonths: 24,
            reminderDays: [30],
          },
        ],
        driverDocuments: [
          {
            type: "driving_license",
            required: true,
            renewable: true,
            expiryMonths: 120,
            reminderDays: [90, 30],
          },
          {
            type: "professional_card",
            required: true,
            renewable: true,
            expiryMonths: 60,
            reminderDays: [60, 30],
          },
          {
            type: "medical_certificate",
            required: true,
            renewable: true,
            expiryMonths: 24,
            reminderDays: [30, 15],
          },
          {
            type: "criminal_record",
            required: true,
            renewable: true,
            expiryMonths: 3,
            reminderDays: [15],
          },
        ],
      },
      AE: {
        country: "AE",
        vehicleDocuments: [
          {
            type: "registration",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30, 15],
          },
          {
            type: "insurance",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30, 15, 7],
          },
          {
            type: "rta_permit",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30, 15],
          },
          {
            type: "emirates_insurance",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
        ],
        driverDocuments: [
          {
            type: "driving_license",
            required: true,
            renewable: true,
            expiryMonths: 24,
            reminderDays: [60, 30],
          },
          {
            type: "emirates_id",
            required: true,
            renewable: true,
            expiryMonths: 24,
            reminderDays: [60, 30],
          },
          {
            type: "rta_license",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30, 15],
          },
          {
            type: "medical_fitness",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
        ],
      },
      US: {
        country: "US",
        vehicleDocuments: [
          {
            type: "registration",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
          {
            type: "insurance",
            required: true,
            renewable: true,
            expiryMonths: 6,
            reminderDays: [30, 15, 7],
          },
          {
            type: "commercial_permit",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
          {
            type: "safety_inspection",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
        ],
        driverDocuments: [
          {
            type: "driving_license",
            required: true,
            renewable: true,
            expiryMonths: 48,
            reminderDays: [60, 30],
          },
          {
            type: "tlc_license",
            required: true,
            renewable: true,
            expiryMonths: 24,
            reminderDays: [60, 30],
          },
          {
            type: "background_check",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
          {
            type: "drug_test",
            required: true,
            renewable: true,
            expiryMonths: 12,
            reminderDays: [30],
          },
        ],
      },
    };

    const requirements =
      countryRequirements[country] || countryRequirements["US"];
    return entityType === "vehicle"
      ? requirements.vehicleDocuments
      : requirements.driverDocuments;
  }

  /**
   * Check document expiry for an entity
   */
  async checkDocumentExpiry(
    entityType: string,
    entityId: string,
    tenantId: string
  ): Promise<DocumentExpiryCheck[]> {
    const documents = await this.documentRepo.findByEntity(
      entityType,
      entityId,
      tenantId
    );

    const results: DocumentExpiryCheck[] = [];
    const now = new Date();

    for (const doc of documents) {
      if (doc.expiry_date) {
        const expiryDate = new Date(doc.expiry_date);
        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        results.push({
          document: doc,
          days_until_expiry: daysUntilExpiry,
          is_expired: daysUntilExpiry < 0,
          requires_renewal: daysUntilExpiry <= 30,
        });
      }
    }

    return results;
  }

  /**
   * Send expiry notifications for documents
   */
  async sendExpiryNotifications(tenantId: string): Promise<void> {
    // Get documents expiring within 30 days
    const expiringDocuments = await this.documentRepo.findExpiringDocuments(
      tenantId,
      30
    );

    for (const doc of expiringDocuments) {
      if (doc.days_until_expiry !== undefined) {
        // Check if notification should be sent based on reminder days
        const reminderDays = [30, 15, 7, 3, 1];

        if (reminderDays.includes(doc.days_until_expiry)) {
          // Send notification via EmailService
          await this.emailService.sendDocumentExpiryReminder(doc);

          // Log notification sent
          await auditLog({
            tenantId,
            action: "export", // Using export as proxy for notification
            entityType: "document",
            entityId: doc.id,
            metadata: {
              notification_type: "expiry_reminder",
              days_until_expiry: doc.days_until_expiry,
              document_type: doc.document_type,
              entity_type: doc.entity_type,
              entity_id: doc.entity_id,
            },
          });
        }
      }
    }

    // Get expired documents
    const expiredDocuments =
      await this.documentRepo.findExpiredDocuments(tenantId);

    for (const doc of expiredDocuments) {
      // Send expired notification
      await this.emailService.sendDocumentExpired(doc);

      await auditLog({
        tenantId,
        action: "export", // Using export as proxy for notification
        entityType: "document",
        entityId: doc.id,
        metadata: {
          notification_type: "document_expired",
          document_type: doc.document_type,
          entity_type: doc.entity_type,
          entity_id: doc.entity_id,
        },
      });
    }
  }

  /**
   * Get all documents for an entity
   */
  async getEntityDocuments(
    entityType: string,
    entityId: string,
    tenantId: string
  ): Promise<DocumentWithMetadata[]> {
    return this.documentRepo.findByEntity(entityType, entityId, tenantId);
  }

  /**
   * Get documents pending verification
   */
  async getPendingVerificationDocuments(tenantId: string): Promise<Document[]> {
    return this.documentRepo.findPendingVerification(tenantId);
  }

  /**
   * Search documents with filters
   */
  async searchDocuments(
    filters: DocumentFilters,
    tenantId: string
  ): Promise<DocumentWithMetadata[]> {
    return this.documentRepo.findWithFilters(filters, tenantId);
  }

  /**
   * Batch upload documents for an entity
   */
  async batchUploadDocuments(
    entityType: string,
    entityId: string,
    documents: Array<{
      documentType: string;
      uploadData: UploadDocumentDto;
    }>,
    userId: string,
    tenantId: string
  ): Promise<BatchUploadResult> {
    const successful: Document[] = [];
    const failed: Array<{ document_type: string; error: string }> = [];

    for (const { documentType, uploadData } of documents) {
      try {
        // Create or find placeholder
        const placeholder = await this.createPlaceholder(
          entityType,
          entityId,
          documentType,
          tenantId,
          userId
        );

        // Upload document
        const uploaded = await this.uploadDocument(
          placeholder.id,
          uploadData,
          userId,
          tenantId
        );

        successful.push(uploaded);
      } catch (error) {
        failed.push({
          document_type: documentType,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(
    documentId: string,
    userId: string,
    reason: string,
    tenantId: string
  ): Promise<void> {
    const document = await this.documentRepo.findById(documentId, tenantId);
    if (!document) {
      throw new NotFoundError("Document");
    }

    await this.documentRepo.softDelete(documentId, userId, reason, tenantId);

    await auditLog({
      tenantId,
      action: "delete",
      entityType: "document",
      entityId: documentId,
      performedBy: userId,
      reason,
      snapshot: document,
    });
  }

  /**
   * Note: Document restore not available - doc_documents table doesn't support soft-delete
   * Documents are permanently deleted when removed
   */

  // Phase 2 Features (not yet implemented):
  // - Supabase Storage integration for file uploads
  // - Verification workflow automation
}
