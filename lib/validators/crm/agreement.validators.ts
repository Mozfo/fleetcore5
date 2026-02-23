/**
 * CRM Agreement Validators - Quote-to-Cash
 *
 * Zod schemas for Agreement (contract) validation in the Quote-to-Cash flow.
 * Handles validation for agreement creation, signature workflow, and lifecycle.
 *
 * Schemas exported:
 * - CreateAgreementSchema: Create new agreement
 * - UpdateAgreementSchema: Update agreement fields
 * - RecordClientSignatureSchema: Record client signature
 * - RecordProviderSignatureSchema: Record provider signature
 * - TerminateAgreementSchema: Terminate agreement
 * - DeleteAgreementSchema: Delete agreement (soft delete)
 * - CreateNewVersionSchema: Create new version of agreement
 * - AgreementQuerySchema: Query/filter agreements
 * - AgreementStatusUpdateSchema: Status change validation
 *
 * Form Schemas (string → transforms):
 * - CreateAgreementFormSchema: UI form for agreement creation
 * - RecordClientSignatureFormSchema: UI form for client signature
 * - TerminateAgreementFormSchema: UI form for termination
 *
 * NOTE: tenant_id and created_by are NOT included in schemas.
 * They are injected at the action layer via getTenantContext() and auth().
 * See: lib/auth/server.ts
 *
 * @module lib/validators/crm/agreement.validators
 */

import { z } from "zod";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Agreement type values
 *
 * Maps to PostgreSQL ENUM: agreement_type
 * Defines the type of legal agreement.
 *
 * Types:
 * - msa: Master Service Agreement
 * - sla: Service Level Agreement
 * - dpa: Data Processing Agreement (GDPR)
 * - nda: Non-Disclosure Agreement
 * - sow: Statement of Work
 * - addendum: Contract Addendum
 * - other: Other agreement type
 *
 * @see prisma/schema.prisma:6151-6159 enum agreement_type
 */
export const AGREEMENT_TYPES = [
  "msa",
  "sla",
  "dpa",
  "nda",
  "sow",
  "addendum",
  "other",
] as const;

export type AgreementType = (typeof AGREEMENT_TYPES)[number];

/**
 * Agreement status values
 *
 * Maps to PostgreSQL ENUM: agreement_status
 * Represents the lifecycle of an agreement.
 *
 * Workflow:
 * draft → pending_review → pending_signature → signed → active → expired/terminated
 *
 * @see prisma/schema.prisma:6161-6170 enum agreement_status
 */
export const AGREEMENT_STATUSES = [
  "draft",
  "pending_review",
  "pending_signature",
  "signed",
  "active",
  "expired",
  "terminated",
  "superseded",
] as const;

export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

/**
 * Signature method values
 *
 * Maps to PostgreSQL ENUM: signature_method
 * Defines how the agreement is signed.
 *
 * @see prisma/schema.prisma:5879-5887 enum signature_method
 */
export const SIGNATURE_METHODS = [
  "digital",
  "wet_signature",
  "app",
  "email",
  "electronic",
  "wet_ink",
  "click_wrap",
] as const;

export type SignatureMethod = (typeof SIGNATURE_METHODS)[number];

/**
 * Common signature provider names
 *
 * Not a Prisma enum - just common values for signature_provider field.
 */
export const SIGNATURE_PROVIDERS = [
  "docusign",
  "hellosign",
  "adobe_sign",
  "pandadoc",
  "signrequest",
  "other",
] as const;

export type SignatureProvider = (typeof SIGNATURE_PROVIDERS)[number];

/**
 * Valid status transitions for agreement workflow
 *
 * Defines which status transitions are allowed.
 * Used for runtime validation of status changes.
 *
 * @see lib/services/crm/agreement.service.ts ALLOWED_TRANSITIONS
 *
 * @example
 * ```typescript
 * const currentStatus: AgreementStatus = "draft";
 * const allowedNext = VALID_AGREEMENT_STATUS_TRANSITIONS[currentStatus];
 * // allowedNext = ["pending_review", "pending_signature"]
 *
 * const isValid = allowedNext.includes("pending_signature"); // true
 * const isInvalid = allowedNext.includes("active"); // false
 * ```
 */
export const VALID_AGREEMENT_STATUS_TRANSITIONS: Record<
  AgreementStatus,
  AgreementStatus[]
> = {
  draft: ["pending_review", "pending_signature"],
  pending_review: ["pending_signature", "draft"],
  pending_signature: ["signed", "expired", "terminated"],
  signed: ["active", "terminated"],
  active: ["expired", "terminated", "superseded"],
  expired: [],
  terminated: [],
  superseded: [],
};

// =============================================================================
// BASE SCHEMAS
// =============================================================================

/**
 * Schema for agreement type validation
 */
export const agreementTypeSchema = z.enum(AGREEMENT_TYPES);

/**
 * Schema for agreement status validation
 */
export const agreementStatusSchema = z.enum(AGREEMENT_STATUSES);

/**
 * Schema for signature method validation
 */
export const signatureMethodSchema = z.enum(SIGNATURE_METHODS);

// =============================================================================
// API SCHEMAS
// =============================================================================

/**
 * Schema for creating a new agreement
 *
 * Creates an agreement linked to an order.
 *
 * NOTE: tenant_id and created_by are NOT included.
 * They are injected at the action layer.
 *
 * Validation rules:
 * - orderId and agreementType are required
 * - expiryDate must be after effectiveDate (if both provided)
 * - Email must be valid format if provided
 * - URL must be valid format if provided
 *
 * @example
 * ```typescript
 * const input = {
 *   orderId: "uuid-order",
 *   agreementType: "msa",
 *   effectiveDate: new Date("2025-01-01"),
 *   expiryDate: new Date("2026-01-01"),
 *   signatureMethod: "electronic",
 *   clientSignatoryName: "John Doe",
 *   clientSignatoryEmail: "john@company.com",
 * };
 * const validated = CreateAgreementSchema.parse(input);
 * ```
 */
export const CreateAgreementSchema = z
  .object({
    /** Order ID this agreement belongs to */
    orderId: z
      .string()
      .min(1, "Order ID is required")
      .uuid("Invalid order ID format"),

    /** Type of agreement */
    agreementType: agreementTypeSchema.describe(
      "Type of agreement: msa, sla, dpa, nda, sow, addendum, or other"
    ),

    /** When the agreement takes effect */
    effectiveDate: z.coerce.date().optional().nullable(),

    /** When the agreement expires */
    expiryDate: z.coerce.date().optional().nullable(),

    /** Method of signature */
    signatureMethod: signatureMethodSchema.default("electronic"),

    /** External signature provider (docusign, hellosign, etc.) */
    signatureProvider: z
      .string()
      .max(50, "Signature provider cannot exceed 50 characters")
      .optional()
      .nullable(),

    /** Client signatory name */
    clientSignatoryName: z
      .string()
      .max(200, "Client signatory name cannot exceed 200 characters")
      .optional()
      .nullable(),

    /** Client signatory email */
    clientSignatoryEmail: z
      .string()
      .email("Invalid email format")
      .max(255, "Email cannot exceed 255 characters")
      .optional()
      .nullable(),

    /** Client signatory title/position */
    clientSignatoryTitle: z
      .string()
      .max(100, "Client signatory title cannot exceed 100 characters")
      .optional()
      .nullable(),

    /** Provider signatory (internal employee UUID) */
    providerSignatoryId: z
      .string()
      .uuid("Invalid signatory ID format")
      .optional()
      .nullable(),

    /** Document URL (unsigned) */
    documentUrl: z
      .string()
      .url("Invalid document URL format")
      .optional()
      .nullable(),

    /** Terms version identifier */
    termsVersion: z
      .string()
      .max(20, "Terms version cannot exceed 20 characters")
      .optional()
      .nullable(),

    /** Governing law (e.g., "French Law") */
    governingLaw: z
      .string()
      .max(100, "Governing law cannot exceed 100 characters")
      .optional()
      .nullable(),

    /** Jurisdiction (e.g., "Paris, France") */
    jurisdiction: z
      .string()
      .max(200, "Jurisdiction cannot exceed 200 characters")
      .optional()
      .nullable(),

    /** Internal notes */
    internalNotes: z
      .string()
      .max(5000, "Internal notes cannot exceed 5000 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // expiryDate must be after effectiveDate if both provided
      if (
        data.effectiveDate &&
        data.expiryDate &&
        data.expiryDate <= data.effectiveDate
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Expiry date must be after effective date",
      path: ["expiryDate"],
    }
  );

/**
 * Schema for updating an existing agreement
 *
 * All fields are optional - only provided fields will be updated.
 * Agreement must be in "draft" status to be updated.
 *
 * @example
 * ```typescript
 * const update = {
 *   effectiveDate: new Date("2025-02-01"),
 *   governingLaw: "French Law",
 * };
 * const validated = UpdateAgreementSchema.parse(update);
 * ```
 */
export const UpdateAgreementSchema = z.object({
  effectiveDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
  signatureMethod: signatureMethodSchema.optional(),
  signatureProvider: z
    .string()
    .max(50, "Signature provider cannot exceed 50 characters")
    .optional()
    .nullable(),
  clientSignatoryName: z
    .string()
    .max(200, "Client signatory name cannot exceed 200 characters")
    .optional()
    .nullable(),
  clientSignatoryEmail: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters")
    .optional()
    .nullable(),
  clientSignatoryTitle: z
    .string()
    .max(100, "Client signatory title cannot exceed 100 characters")
    .optional()
    .nullable(),
  providerSignatoryId: z
    .string()
    .uuid("Invalid signatory ID format")
    .optional()
    .nullable(),
  documentUrl: z
    .string()
    .url("Invalid document URL format")
    .optional()
    .nullable(),
  termsVersion: z
    .string()
    .max(20, "Terms version cannot exceed 20 characters")
    .optional()
    .nullable(),
  governingLaw: z
    .string()
    .max(100, "Governing law cannot exceed 100 characters")
    .optional()
    .nullable(),
  jurisdiction: z
    .string()
    .max(200, "Jurisdiction cannot exceed 200 characters")
    .optional()
    .nullable(),
  internalNotes: z
    .string()
    .max(5000, "Internal notes cannot exceed 5000 characters")
    .optional()
    .nullable(),
});

/**
 * Schema for recording client signature
 *
 * Used when a client signs the agreement.
 *
 * @example
 * ```typescript
 * const input = {
 *   agreementId: "uuid-agreement",
 *   signatoryName: "John Doe",
 *   signatoryEmail: "john@company.com",
 *   signatoryTitle: "CEO",
 *   signatureIp: "192.168.1.1",
 * };
 * const validated = RecordClientSignatureSchema.parse(input);
 * ```
 */
export const RecordClientSignatureSchema = z.object({
  /** Agreement ID */
  agreementId: z.string().uuid("Invalid agreement ID"),

  /** Client signatory name (required) */
  signatoryName: z
    .string()
    .min(1, "Signatory name is required")
    .max(200, "Signatory name cannot exceed 200 characters"),

  /** Client signatory email (required) */
  signatoryEmail: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters"),

  /** Client signatory title/position */
  signatoryTitle: z
    .string()
    .max(100, "Signatory title cannot exceed 100 characters")
    .optional()
    .nullable(),

  /** IP address of signature (for audit trail) */
  signatureIp: z
    .string()
    .max(45, "IP address cannot exceed 45 characters") // IPv6 max length
    .optional()
    .nullable(),
});

/**
 * Schema for recording provider signature
 *
 * Used when a FleetCore employee signs on behalf of the provider.
 *
 * @example
 * ```typescript
 * const input = {
 *   agreementId: "uuid-agreement",
 *   signatoryId: "uuid-employee",
 *   signatoryName: "Jane Smith", // Optional override
 *   signatoryTitle: "Sales Director", // Optional override
 * };
 * const validated = RecordProviderSignatureSchema.parse(input);
 * ```
 */
export const RecordProviderSignatureSchema = z.object({
  /** Agreement ID */
  agreementId: z.string().uuid("Invalid agreement ID"),

  /** Provider employee ID (required) */
  signatoryId: z.string().uuid("Invalid signatory ID"),

  /** Override signatory name (optional, defaults to employee name) */
  signatoryName: z
    .string()
    .max(200, "Signatory name cannot exceed 200 characters")
    .optional()
    .nullable(),

  /** Override signatory title (optional, defaults to employee title) */
  signatoryTitle: z
    .string()
    .max(100, "Signatory title cannot exceed 100 characters")
    .optional()
    .nullable(),
});

/**
 * Schema for terminating an agreement
 *
 * Requires a termination reason for audit trail.
 *
 * @example
 * ```typescript
 * const input = {
 *   agreementId: "uuid-agreement",
 *   reason: "Client requested early termination due to business closure",
 * };
 * const validated = TerminateAgreementSchema.parse(input);
 * ```
 */
export const TerminateAgreementSchema = z.object({
  /** Agreement ID */
  agreementId: z.string().uuid("Invalid agreement ID"),

  /** Termination reason (required for audit) */
  reason: z
    .string()
    .min(1, "Termination reason is required")
    .max(2000, "Termination reason cannot exceed 2000 characters"),
});

/**
 * Schema for deleting an agreement (soft delete)
 *
 * Requires a deletion reason for audit trail.
 *
 * @example
 * ```typescript
 * const input = {
 *   agreementId: "uuid-agreement",
 *   reason: "Created in error - duplicate agreement",
 * };
 * const validated = DeleteAgreementSchema.parse(input);
 * ```
 */
export const DeleteAgreementSchema = z.object({
  /** Agreement ID */
  agreementId: z.string().uuid("Invalid agreement ID"),

  /** Deletion reason (required for audit) */
  reason: z
    .string()
    .min(1, "Deletion reason is required")
    .max(2000, "Deletion reason cannot exceed 2000 characters"),
});

/**
 * Schema for creating a new version of an agreement
 *
 * Creates a new version, marking the original as superseded.
 *
 * @example
 * ```typescript
 * const input = {
 *   originalAgreementId: "uuid-original-agreement",
 * };
 * const validated = CreateNewVersionSchema.parse(input);
 * ```
 */
export const CreateNewVersionSchema = z.object({
  /** Original agreement ID to create new version from */
  originalAgreementId: z.string().uuid("Invalid agreement ID"),
});

// =============================================================================
// UI FORM SCHEMAS
// =============================================================================

/**
 * Schema for agreement creation form (UI)
 *
 * Handles string inputs from form fields.
 * Use CreateAgreementSchema for API validation.
 *
 * @example
 * ```typescript
 * const formData = {
 *   orderId: "uuid",
 *   agreementType: "msa",
 *   effectiveDate: "2025-01-01",
 *   clientSignatoryEmail: "",
 * };
 * const validated = CreateAgreementFormSchema.parse(formData);
 * ```
 */
export const CreateAgreementFormSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  agreementType: agreementTypeSchema,
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  signatureMethod: signatureMethodSchema.default("electronic"),
  signatureProvider: z.string().max(50).optional(),
  clientSignatoryName: z.string().max(200).optional(),
  clientSignatoryEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  clientSignatoryTitle: z.string().max(100).optional(),
  providerSignatoryId: z.string().optional(),
  documentUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  governingLaw: z.string().max(100).optional(),
  jurisdiction: z.string().max(200).optional(),
  internalNotes: z.string().max(5000).optional(),
});

/**
 * Schema for client signature form (UI)
 *
 * @example
 * ```typescript
 * const formData = {
 *   signatoryName: "John Doe",
 *   signatoryEmail: "john@company.com",
 *   signatoryTitle: "CEO",
 * };
 * const validated = RecordClientSignatureFormSchema.parse(formData);
 * ```
 */
export const RecordClientSignatureFormSchema = z.object({
  signatoryName: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name cannot exceed 200 characters"),
  signatoryEmail: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters"),
  signatoryTitle: z
    .string()
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
});

/**
 * Schema for termination form (UI)
 *
 * @example
 * ```typescript
 * const formData = {
 *   reason: "Client requested early termination",
 * };
 * const validated = TerminateAgreementFormSchema.parse(formData);
 * ```
 */
export const TerminateAgreementFormSchema = z.object({
  reason: z
    .string()
    .min(1, "Please provide a reason")
    .max(2000, "Reason cannot exceed 2000 characters"),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Schema for querying/filtering agreements
 *
 * Used by GET /api/v1/crm/agreements endpoint.
 * Supports pagination, filtering, and sorting.
 *
 * @example
 * ```typescript
 * const query = {
 *   page: 1,
 *   limit: 20,
 *   status: "active",
 *   agreementType: "msa",
 *   sortBy: "created_at",
 *   sortOrder: "desc",
 * };
 * const validated = AgreementQuerySchema.parse(query);
 * ```
 */
export const AgreementQuerySchema = z.object({
  /** Page number (1-based) */
  page: z.coerce.number().int().min(1).default(1),

  /** Items per page (1-100) */
  limit: z.coerce.number().int().min(1).max(100).default(20),

  /** Filter by status */
  status: agreementStatusSchema.optional(),

  /** Filter by agreement type */
  agreementType: agreementTypeSchema.optional(),

  /** Filter by order */
  orderId: z.string().uuid().optional(),

  /** Filter by signature method */
  signatureMethod: signatureMethodSchema.optional(),

  /** Filter by effective date range (from) */
  effectiveFrom: z.coerce.date().optional(),

  /** Filter by effective date range (to) */
  effectiveTo: z.coerce.date().optional(),

  /** Filter by expiry date range (from) */
  expiryFrom: z.coerce.date().optional(),

  /** Filter by expiry date range (to) */
  expiryTo: z.coerce.date().optional(),

  /** Search in reference, notes */
  search: z.string().max(100).optional(),

  /** Sort field */
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "effective_date",
      "expiry_date",
      "agreement_reference",
    ])
    .default("created_at"),

  /** Sort direction */
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// =============================================================================
// STATUS UPDATE SCHEMA
// =============================================================================

/**
 * Schema for agreement status updates
 *
 * Used internally for status transition validation.
 * Use specific action schemas for user-facing operations.
 *
 * @example
 * ```typescript
 * const update = {
 *   agreementId: "uuid",
 *   newStatus: "pending_signature",
 * };
 * const validated = AgreementStatusUpdateSchema.parse(update);
 *
 * // Check if transition is valid
 * const currentStatus = "draft";
 * const isValid = VALID_AGREEMENT_STATUS_TRANSITIONS[currentStatus].includes(update.newStatus);
 * ```
 */
export const AgreementStatusUpdateSchema = z.object({
  /** Agreement ID */
  agreementId: z.string().uuid("Invalid agreement ID"),

  /** New status */
  newStatus: agreementStatusSchema,

  /** Optional reason for status change */
  reason: z
    .string()
    .max(2000, "Reason cannot exceed 2000 characters")
    .optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// API Types
export type CreateAgreementInput = z.infer<typeof CreateAgreementSchema>;
export type UpdateAgreementInput = z.infer<typeof UpdateAgreementSchema>;
export type RecordClientSignatureInput = z.infer<
  typeof RecordClientSignatureSchema
>;
export type RecordProviderSignatureInput = z.infer<
  typeof RecordProviderSignatureSchema
>;
export type TerminateAgreementInput = z.infer<typeof TerminateAgreementSchema>;
export type DeleteAgreementInput = z.infer<typeof DeleteAgreementSchema>;
export type CreateNewVersionInput = z.infer<typeof CreateNewVersionSchema>;

// Query Types
export type AgreementQueryInput = z.infer<typeof AgreementQuerySchema>;

// Status Types
export type AgreementStatusUpdateInput = z.infer<
  typeof AgreementStatusUpdateSchema
>;

// Form Types
export type CreateAgreementFormInput = z.infer<
  typeof CreateAgreementFormSchema
>;
export type RecordClientSignatureFormInput = z.infer<
  typeof RecordClientSignatureFormSchema
>;
export type TerminateAgreementFormInput = z.infer<
  typeof TerminateAgreementFormSchema
>;
