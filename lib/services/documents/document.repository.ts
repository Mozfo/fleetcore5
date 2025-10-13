// Document repository with specific queries
import { PrismaClient, doc_documents } from "@prisma/client";
import { BaseRepository } from "@/lib/core/base.repository";
import type {
  Document,
  DocumentWithMetadata,
  DocumentFilters,
} from "./document.types";

export class DocumentRepository extends BaseRepository<Document> {
  constructor(prisma: PrismaClient) {
    // Use correct signature: super(model, prisma)
    super(prisma.doc_documents, prisma);
  }

  /**
   * Find documents by entity with metadata
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    tenantId: string
  ): Promise<DocumentWithMetadata[]> {
    const documents = await this.model.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        tenant_id: tenantId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Add computed metadata
    return documents.map((doc: doc_documents) => this.addMetadata(doc));
  }

  /**
   * Find documents expiring within specified days
   */
  async findExpiringDocuments(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<DocumentWithMetadata[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const documents = await this.model.findMany({
      where: {
        tenant_id: tenantId,
        expiry_date: {
          not: null,
          lte: futureDate,
          gte: new Date(), // Not already expired
        },
      },
      orderBy: {
        expiry_date: "asc",
      },
    });

    return documents.map((doc: doc_documents) => this.addMetadata(doc));
  }

  /**
   * Find expired documents
   */
  async findExpiredDocuments(
    tenantId: string
  ): Promise<DocumentWithMetadata[]> {
    const documents = await this.model.findMany({
      where: {
        tenant_id: tenantId,
        expiry_date: {
          not: null,
          lt: new Date(),
        },
      },
      orderBy: {
        expiry_date: "desc",
      },
    });

    return documents.map((doc: doc_documents) => this.addMetadata(doc));
  }

  /**
   * Find documents pending verification
   */
  async findPendingVerification(tenantId: string): Promise<Document[]> {
    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        verified: false,
        file_url: {
          not: null,
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });
  }

  /**
   * Find documents with advanced filters
   */
  async findWithFilters(
    filters: DocumentFilters,
    tenantId: string
  ): Promise<DocumentWithMetadata[]> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
    };

    if (filters.entity_type) {
      where.entity_type = filters.entity_type;
    }

    if (filters.entity_id) {
      where.entity_id = filters.entity_id;
    }

    if (filters.document_type) {
      where.document_type = filters.document_type;
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }

    if (filters.expired) {
      where.expiry_date = {
        not: null,
        lt: new Date(),
      };
    }

    if (filters.expiring_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiring_within_days);
      where.expiry_date = {
        not: null,
        lte: futureDate,
        gte: new Date(),
      };
    }

    const documents = await this.model.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
    });

    return documents.map((doc: doc_documents) => this.addMetadata(doc));
  }

  /**
   * Check if a specific document type exists for an entity
   */
  async documentExists(
    entityType: string,
    entityId: string,
    documentType: string,
    tenantId: string
  ): Promise<boolean> {
    const count = await this.model.count({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        document_type: documentType,
        tenant_id: tenantId,
      },
    });

    return count > 0;
  }

  /**
   * Update document verification status
   * Note: Using audit log for tracking who verified (no verified_by field in schema)
   * Using issue_date to track verification date (no verification_date field)
   */
  async updateVerificationStatus(
    id: string,
    verified: boolean,
    verificationDate: Date,
    tenantId: string
  ): Promise<Document> {
    return await this.model.update({
      where: {
        id,
        tenant_id: tenantId,
      },
      data: {
        verified,
        issue_date: verificationDate, // Using issue_date for verification tracking
        updated_at: new Date(),
      },
    });
  }

  /**
   * Batch create document placeholders
   */
  async createBatchPlaceholders(
    documents: Array<{
      entity_type: string;
      entity_id: string;
      document_type: string;
      tenant_id: string;
    }>
  ): Promise<Document[]> {
    // Create documents in batch
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO doc_documents (entity_type, entity_id, document_type, tenant_id, verified)
      VALUES ${documents.map(() => "(?, ?, ?, ?, false)").join(", ")}
    `,
      ...documents.flatMap((d) => [
        d.entity_type,
        d.entity_id,
        d.document_type,
        d.tenant_id,
      ])
    );

    // Return created documents
    return await this.model.findMany({
      where: {
        OR: documents.map((d) => ({
          entity_type: d.entity_type,
          entity_id: d.entity_id,
          document_type: d.document_type,
          tenant_id: d.tenant_id,
        })),
      },
    });
  }

  /**
   * Add computed metadata to document
   */
  private addMetadata(doc: doc_documents): DocumentWithMetadata {
    const now = new Date();
    let daysUntilExpiry: number | undefined;
    let isExpired = false;
    let requiresRenewal = false;

    if (doc.expiry_date) {
      const expiryDate = new Date(doc.expiry_date);
      daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      isExpired = daysUntilExpiry < 0;
      requiresRenewal = daysUntilExpiry <= 30; // Renewal needed within 30 days
    }

    return {
      ...doc,
      is_expired: isExpired,
      days_until_expiry: daysUntilExpiry,
      requires_renewal: requiresRenewal,
    };
  }

  /**
   * Override softDelete since doc_documents doesn't have soft-delete fields
   * Performs a hard delete instead
   */
  async softDelete(
    id: string,
    userId: string,
    reason?: string,
    tenantId?: string
  ): Promise<void> {
    // Since doc_documents doesn't have soft-delete, we perform a hard delete
    // The audit log will track the deletion with reason and user
    const where: Record<string, unknown> = { id };
    if (tenantId) {
      where.tenant_id = tenantId;
    }

    await this.model.delete({ where });
  }
}
