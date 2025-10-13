// Document service type definitions
import { doc_documents } from "@prisma/client";

// Base document type from Prisma with relations
export type Document = doc_documents;

// Extended document with virtual fields
export interface DocumentWithMetadata extends Document {
  is_expired?: boolean;
  days_until_expiry?: number;
  requires_renewal?: boolean;
}

// Document creation DTO - adapted to match schema
export interface CreateDocumentDto {
  entity_type: string; // e.g., 'flt_vehicles', 'rid_drivers'
  entity_id: string;
  document_type: string; // e.g., 'registration', 'insurance', 'driver_license'
  file_url?: string; // Optional for placeholder creation
  issue_date?: Date | null;
  expiry_date?: Date | null;
  verified?: boolean;
}

// Document update DTO
export interface UpdateDocumentDto {
  file_url?: string;
  issue_date?: Date | null;
  expiry_date?: Date | null;
  verified?: boolean;
}

// Document upload DTO
export interface UploadDocumentDto {
  file: File | Buffer;
  fileName: string;
  fileType: string;
  fileSize: number;
  expiryDate?: Date;
}

// Document verification DTO
export interface VerifyDocumentDto {
  verified: boolean;
  verifiedBy: string;
  rejectionReason?: string;
}

// Document type configuration
export interface DocumentTypeConfig {
  type: string;
  required: boolean;
  renewable: boolean;
  expiryMonths?: number; // Default validity period
  reminderDays?: number[]; // Days before expiry to send reminders
}

// Country-specific document requirements
export interface CountryDocumentRequirements {
  country: string;
  vehicleDocuments: DocumentTypeConfig[];
  driverDocuments: DocumentTypeConfig[];
}

// Document status for tracking
export type DocumentStatus =
  | "pending_upload"
  | "uploaded"
  | "pending_verification"
  | "verified"
  | "rejected"
  | "expired"
  | "expiring_soon";

// Document filters for queries
export interface DocumentFilters {
  entity_type?: string;
  entity_id?: string;
  document_type?: string;
  verified?: boolean;
  expired?: boolean;
  expiring_within_days?: number;
}

// Document expiry check result
export interface DocumentExpiryCheck {
  document: Document;
  days_until_expiry: number;
  is_expired: boolean;
  requires_renewal: boolean;
}

// Batch upload result
export interface BatchUploadResult {
  successful: Document[];
  failed: Array<{
    document_type: string;
    error: string;
  }>;
}
