/**
 * Agreement Actions Tests
 *
 * Comprehensive tests for agreements.actions.ts covering:
 * - 15 Admin actions (auth, validation, service calls)
 * - Error handling (NotFoundError, ValidationError, BusinessRuleError)
 * - Provider isolation
 * - Audit logging
 *
 * All actions are ADMIN-only (no public actions for agreements).
 *
 * @module lib/actions/crm/__tests__/agreements.actions.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type {
  AgreementType,
  AgreementStatus,
  SignatureMethod,
  CreateAgreementInput,
  AgreementQueryInput,
} from "@/lib/validators/crm/agreement.validators";

// Test constant for admin org ID
const TEST_ADMIN_ORG_ID = "org_admin_test";

// =============================================================================
// HOISTED MOCKS - vi.hoisted for mocks used in vi.mock factories
// Must be hoisted BEFORE vi.mock calls which are also hoisted
// =============================================================================

const {
  mockAuth,
  mockDb,
  mockGetAuditLogUuids,
  mockGetCurrentProviderId,
  mockAgreementService,
} = vi.hoisted(() => {
  return {
    mockAuth: vi.fn(),
    mockDb: {
      adm_audit_logs: {
        create: vi.fn(),
      },
    },
    mockGetAuditLogUuids: vi.fn(),
    mockGetCurrentProviderId: vi.fn(),
    mockAgreementService: {
      createAgreement: vi.fn(),
      updateAgreement: vi.fn(),
      deleteAgreement: vi.fn(),
      sendForSignature: vi.fn(),
      recordClientSignature: vi.fn(),
      recordProviderSignature: vi.fn(),
      activateAgreement: vi.fn(),
      terminateAgreement: vi.fn(),
      createNewVersion: vi.fn(),
      getAgreement: vi.fn(),
      getAgreementWithRelations: vi.fn(),
      listAgreements: vi.fn(),
      getAgreementsByOrder: vi.fn(),
      getExpiringSoonAgreements: vi.fn(),
      countByStatus: vi.fn(),
      countByType: vi.fn(),
      getAverageTimeToSignature: vi.fn(),
    },
  };
});

// =============================================================================
// MODULE MOCKS
// =============================================================================

// Mock Better Auth server wrapper
vi.mock("@/lib/auth/server", () => ({
  requireCrmAuth: mockAuth,
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Prisma db
vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock audit log helper
vi.mock("@/lib/utils/audit-resolver", () => ({
  getAuditLogUuids: mockGetAuditLogUuids,
}));

// Mock provider context
vi.mock("@/lib/utils/provider-context", () => ({
  getCurrentProviderId: mockGetCurrentProviderId,
}));

// Mock agreement service
vi.mock("@/lib/services/crm/agreement.service", () => ({
  agreementService: mockAgreementService,
}));

// Mock errors - matches real signatures from lib/core/errors.ts
vi.mock("@/lib/core/errors", () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(public resource: string) {
      super(`${resource} not found`);
      this.name = "NotFoundError";
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(
      message: string,
      public field?: string
    ) {
      super(message);
      this.name = "ValidationError";
    }
  },
  BusinessRuleError: class BusinessRuleError extends Error {
    constructor(
      message: string,
      public rule: string,
      public details?: Record<string, unknown>
    ) {
      super(message);
      this.name = "BusinessRuleError";
    }
  },
}));

// Import after mocks
import {
  createAgreementAction,
  updateAgreementAction,
  deleteAgreementAction,
  sendForSignatureAction,
  recordClientSignatureAction,
  recordProviderSignatureAction,
  activateAgreementAction,
  terminateAgreementAction,
  createNewVersionAction,
  getAgreementAction,
  getAgreementWithRelationsAction,
  listAgreementsAction,
  getAgreementsByOrderAction,
  getExpiringAgreementsAction,
  getAgreementStatsAction,
} from "../agreements.actions";
import {
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} from "@/lib/core/errors";

// =============================================================================
// TEST CONSTANTS
// =============================================================================

const ADMIN_ORG_ID = TEST_ADMIN_ORG_ID;
const TEST_USER_ID = "user_test_123";
const TEST_PROVIDER_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_TENANT_UUID = "550e8400-e29b-41d4-a716-446655440002";
const TEST_MEMBER_UUID = "550e8400-e29b-41d4-a716-446655440003";
const TEST_AGREEMENT_ID = "550e8400-e29b-41d4-a716-446655440004";
const TEST_ORDER_ID = "550e8400-e29b-41d4-a716-446655440005";
const TEST_SIGNATORY_ID = "550e8400-e29b-41d4-a716-446655440006";

// =============================================================================
// MOCK DATA
// =============================================================================

const mockAgreement = {
  id: TEST_AGREEMENT_ID,
  agreement_reference: "AGR-2025-00001",
  order_id: TEST_ORDER_ID,
  provider_id: TEST_PROVIDER_ID,
  agreement_type: "msa" as AgreementType,
  version_number: 1,
  parent_agreement_id: null,
  status: "draft" as AgreementStatus,
  effective_date: new Date("2025-02-01"),
  expiry_date: new Date("2026-02-01"),
  signature_method: "electronic" as SignatureMethod,
  signature_provider: null,
  client_signatory_name: "John Doe",
  client_signatory_email: "john@example.com",
  client_signatory_title: "CEO",
  client_signed_at: null,
  client_signature_ip: null,
  provider_signatory_id: null,
  provider_signatory_name: null,
  provider_signatory_title: null,
  provider_signed_at: null,
  document_url: null,
  signed_document_url: null,
  terms_version: "v1.0",
  governing_law: "French Law",
  jurisdiction: "Paris, France",
  custom_clauses: null,
  internal_notes: null,
  sent_for_signature_at: null,
  metadata: null,
  created_at: new Date(),
  updated_at: new Date(),
  created_by: TEST_USER_ID,
  updated_by: TEST_USER_ID,
  deleted_at: null,
  deleted_by: null,
  deletion_reason: null,
  provider_envelope_id: null,
  provider_envelope_url: null,
};

const mockAgreementWithRelations = {
  ...mockAgreement,
  crm_orders: {
    id: TEST_ORDER_ID,
    order_reference: "ORD-2025-00001",
    status: "active",
    total_value: 60000,
    currency: "EUR",
  },
  parent_agreement: null,
  child_agreements: [],
  provider_signatory: null,
};

const mockSendForSignatureResult = {
  agreement: {
    ...mockAgreement,
    status: "pending_signature" as AgreementStatus,
  },
  publicToken: "public_token_123",
  sentAt: new Date(),
};

// =============================================================================
// TEST HELPERS
// =============================================================================

function setupAdminAuth(): void {
  mockAuth.mockResolvedValue({ userId: TEST_USER_ID, orgId: ADMIN_ORG_ID });
  mockGetCurrentProviderId.mockResolvedValue(TEST_PROVIDER_ID);
  mockGetAuditLogUuids.mockResolvedValue({
    tenantUuid: TEST_TENANT_UUID,
    memberUuid: TEST_MEMBER_UUID,
  });
}

function setupNoAuth(): void {
  mockAuth.mockRejectedValue(new Error("AUTH: Not authenticated"));
}

function setupWrongOrg(): void {
  mockAuth.mockRejectedValue(
    new Error("AUTH: Not a headquarters organization")
  );
}

function setupNoProvider(): void {
  mockAuth.mockResolvedValue({ userId: TEST_USER_ID, orgId: ADMIN_ORG_ID });
  mockGetCurrentProviderId.mockResolvedValue(null);
}

function resetMocks(): void {
  mockAuth.mockClear();
  mockGetCurrentProviderId.mockClear();
  mockGetAuditLogUuids.mockClear();
  mockDb.adm_audit_logs.create.mockClear();
  Object.values(mockAgreementService).forEach((fn) => fn.mockClear());
}

/**
 * Factory function for creating valid CreateAgreementInput
 * Following TypeScript best practice: explicit type annotation ensures
 * type safety without 'as const' hacks on individual properties.
 */
function createValidAgreementInput(
  overrides?: Partial<CreateAgreementInput>
): CreateAgreementInput {
  return {
    orderId: TEST_ORDER_ID,
    agreementType: "msa",
    signatureMethod: "electronic",
    effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    clientSignatoryName: "John Doe",
    clientSignatoryEmail: "john@example.com",
    governingLaw: "French Law",
    jurisdiction: "Paris, France",
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("agreements.actions.ts", () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // CRUD ACTIONS
  // ===========================================================================

  describe("createAgreementAction", () => {
    const validInput = createValidAgreementInput();

    it("should create an agreement successfully", async () => {
      setupAdminAuth();
      mockAgreementService.createAgreement.mockResolvedValue(mockAgreement);

      const result = await createAgreementAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.id).toBe(TEST_AGREEMENT_ID);
        expect(result.agreement.agreement_reference).toBe("AGR-2025-00001");
      }
      expect(mockAgreementService.createAgreement).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: TEST_ORDER_ID,
          providerId: TEST_PROVIDER_ID,
          userId: TEST_USER_ID,
          agreementType: "msa",
        })
      );
    });

    it("should return error when not authenticated", async () => {
      setupNoAuth();

      const result = await createAgreementAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("AUTH: Not authenticated");
      }
    });

    it("should return error when not admin org", async () => {
      setupWrongOrg();

      const result = await createAgreementAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("AUTH: Not a headquarters organization");
      }
    });

    it("should return error when no provider context", async () => {
      setupNoProvider();

      const result = await createAgreementAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Provider context required");
      }
    });

    it("should return validation error for invalid order ID", async () => {
      setupAdminAuth();

      const result = await createAgreementAction({
        ...validInput,
        orderId: "invalid-uuid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid order ID");
      }
    });

    it("should handle NotFoundError from service", async () => {
      setupAdminAuth();
      mockAgreementService.createAgreement.mockRejectedValue(
        new NotFoundError(`Order ${TEST_ORDER_ID}`)
      );

      const result = await createAgreementAction(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should create audit log on success", async () => {
      setupAdminAuth();
      mockAgreementService.createAgreement.mockResolvedValue(mockAgreement);

      await createAgreementAction(validInput);

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: TEST_TENANT_UUID,
          member_id: TEST_MEMBER_UUID,
          entity: "crm_agreement",
          entity_id: TEST_AGREEMENT_ID,
          action: "CREATE",
        }),
      });
    });
  });

  describe("updateAgreementAction", () => {
    const updateInput = { governingLaw: "UK Law" };

    it("should update agreement successfully", async () => {
      setupAdminAuth();
      mockAgreementService.updateAgreement.mockResolvedValue({
        ...mockAgreement,
        governing_law: "UK Law",
      });

      const result = await updateAgreementAction(
        TEST_AGREEMENT_ID,
        updateInput
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.governing_law).toBe("UK Law");
      }
    });

    it("should return error for invalid agreement ID", async () => {
      setupAdminAuth();

      const result = await updateAgreementAction("invalid-uuid", updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid agreement ID");
      }
    });

    it("should handle BusinessRuleError for non-draft agreement", async () => {
      setupAdminAuth();
      mockAgreementService.updateAgreement.mockRejectedValue(
        new BusinessRuleError(
          "Only draft agreements can be updated",
          "agreement_not_draft",
          { currentStatus: "active" }
        )
      );

      const result = await updateAgreementAction(
        TEST_AGREEMENT_ID,
        updateInput
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("draft");
      }
    });
  });

  describe("deleteAgreementAction", () => {
    const deleteInput = {
      agreementId: TEST_AGREEMENT_ID,
      reason: "Created in error - duplicate agreement",
    };

    it("should delete agreement successfully", async () => {
      setupAdminAuth();
      mockAgreementService.deleteAgreement.mockResolvedValue(undefined);

      const result = await deleteAgreementAction(deleteInput);

      expect(result.success).toBe(true);
      expect(mockAgreementService.deleteAgreement).toHaveBeenCalledWith(
        TEST_AGREEMENT_ID,
        TEST_PROVIDER_ID,
        TEST_USER_ID,
        deleteInput.reason
      );
    });

    it("should return validation error for short reason", async () => {
      setupAdminAuth();

      const result = await deleteAgreementAction({
        agreementId: TEST_AGREEMENT_ID,
        reason: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("reason");
      }
    });

    it("should create audit log with warning severity", async () => {
      setupAdminAuth();
      mockAgreementService.deleteAgreement.mockResolvedValue(undefined);

      await deleteAgreementAction(deleteInput);

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "DELETE",
          severity: "warning",
        }),
      });
    });
  });

  // ===========================================================================
  // SIGNATURE WORKFLOW ACTIONS
  // ===========================================================================

  describe("sendForSignatureAction", () => {
    it("should send agreement for signature successfully", async () => {
      setupAdminAuth();
      mockAgreementService.sendForSignature.mockResolvedValue(
        mockSendForSignatureResult
      );

      const result = await sendForSignatureAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicToken).toBe("public_token_123");
        expect(result.data.agreement.status).toBe("pending_signature");
      }
    });

    it("should return error for invalid agreement ID", async () => {
      setupAdminAuth();

      const result = await sendForSignatureAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid agreement ID");
      }
    });

    it("should handle ValidationError for missing client email", async () => {
      setupAdminAuth();
      mockAgreementService.sendForSignature.mockRejectedValue(
        new ValidationError(
          "Client signatory email is required to send for signature"
        )
      );

      const result = await sendForSignatureAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("email");
      }
    });
  });

  describe("recordClientSignatureAction", () => {
    const signatureInput = {
      agreementId: TEST_AGREEMENT_ID,
      signatoryName: "John Doe",
      signatoryEmail: "john@example.com",
      signatoryTitle: "CEO",
    };

    it("should record client signature successfully", async () => {
      setupAdminAuth();
      mockAgreementService.recordClientSignature.mockResolvedValue({
        ...mockAgreement,
        client_signed_at: new Date(),
      });

      const result = await recordClientSignatureAction(signatureInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.client_signed_at).toBeDefined();
      }
    });

    it("should return validation error for invalid email", async () => {
      setupAdminAuth();

      const result = await recordClientSignatureAction({
        ...signatureInput,
        signatoryEmail: "invalid-email",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("email");
      }
    });

    it("should handle BusinessRuleError for wrong status", async () => {
      setupAdminAuth();
      mockAgreementService.recordClientSignature.mockRejectedValue(
        new BusinessRuleError(
          "Cannot record signature on agreement in draft status",
          "invalid_status_for_signature",
          { currentStatus: "draft" }
        )
      );

      const result = await recordClientSignatureAction(signatureInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Cannot record signature");
      }
    });
  });

  describe("recordProviderSignatureAction", () => {
    const signatureInput = {
      agreementId: TEST_AGREEMENT_ID,
      signatoryId: TEST_SIGNATORY_ID,
    };

    it("should record provider signature successfully", async () => {
      setupAdminAuth();
      mockAgreementService.recordProviderSignature.mockResolvedValue({
        ...mockAgreement,
        provider_signed_at: new Date(),
        provider_signatory_id: TEST_SIGNATORY_ID,
      });

      const result = await recordProviderSignatureAction(signatureInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.provider_signed_at).toBeDefined();
      }
    });

    it("should return validation error for invalid signatory ID", async () => {
      setupAdminAuth();

      const result = await recordProviderSignatureAction({
        agreementId: TEST_AGREEMENT_ID,
        signatoryId: "invalid-uuid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("signatory");
      }
    });
  });

  describe("activateAgreementAction", () => {
    it("should activate agreement successfully", async () => {
      setupAdminAuth();
      mockAgreementService.activateAgreement.mockResolvedValue({
        ...mockAgreement,
        status: "active" as AgreementStatus,
      });

      const result = await activateAgreementAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.status).toBe("active");
      }
    });

    it("should handle BusinessRuleError for missing signatures", async () => {
      setupAdminAuth();
      mockAgreementService.activateAgreement.mockRejectedValue(
        new BusinessRuleError(
          "Both parties must sign before activation",
          "signatures_required",
          { clientSigned: false, providerSigned: true }
        )
      );

      const result = await activateAgreementAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Both parties must sign");
      }
    });
  });

  // ===========================================================================
  // LIFECYCLE ACTIONS
  // ===========================================================================

  describe("terminateAgreementAction", () => {
    const terminateInput = {
      agreementId: TEST_AGREEMENT_ID,
      reason: "Client requested early termination due to business closure",
    };

    it("should terminate agreement successfully", async () => {
      setupAdminAuth();
      mockAgreementService.terminateAgreement.mockResolvedValue({
        ...mockAgreement,
        status: "terminated" as AgreementStatus,
      });

      const result = await terminateAgreementAction(terminateInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.status).toBe("terminated");
      }
    });

    it("should create audit log with warning severity", async () => {
      setupAdminAuth();
      mockAgreementService.terminateAgreement.mockResolvedValue({
        ...mockAgreement,
        status: "terminated" as AgreementStatus,
      });

      await terminateAgreementAction(terminateInput);

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "TERMINATE",
          severity: "warning",
        }),
      });
    });
  });

  describe("createNewVersionAction", () => {
    const versionInput = { originalAgreementId: TEST_AGREEMENT_ID };

    it("should create new version successfully", async () => {
      setupAdminAuth();
      mockAgreementService.createNewVersion.mockResolvedValue({
        ...mockAgreement,
        id: "new-agreement-id",
        version_number: 2,
        parent_agreement_id: TEST_AGREEMENT_ID,
      });

      const result = await createNewVersionAction(versionInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement.version_number).toBe(2);
        expect(result.agreement.parent_agreement_id).toBe(TEST_AGREEMENT_ID);
      }
    });

    it("should handle NotFoundError", async () => {
      setupAdminAuth();
      mockAgreementService.createNewVersion.mockRejectedValue(
        new NotFoundError(`Agreement ${TEST_AGREEMENT_ID}`)
      );

      const result = await createNewVersionAction(versionInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  // ===========================================================================
  // QUERY ACTIONS
  // ===========================================================================

  describe("getAgreementAction", () => {
    it("should get agreement by ID", async () => {
      setupAdminAuth();
      mockAgreementService.getAgreement.mockResolvedValue(mockAgreement);

      const result = await getAgreementAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement?.id).toBe(TEST_AGREEMENT_ID);
      }
    });

    it("should return null for non-existent agreement", async () => {
      setupAdminAuth();
      mockAgreementService.getAgreement.mockResolvedValue(null);

      const result = await getAgreementAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement).toBeNull();
      }
    });

    it("should return error for invalid ID", async () => {
      setupAdminAuth();

      const result = await getAgreementAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid agreement ID");
      }
    });
  });

  describe("getAgreementWithRelationsAction", () => {
    it("should get agreement with relations", async () => {
      setupAdminAuth();
      mockAgreementService.getAgreementWithRelations.mockResolvedValue(
        mockAgreementWithRelations
      );

      const result = await getAgreementWithRelationsAction(TEST_AGREEMENT_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreement?.crm_orders).toBeDefined();
        expect(result.agreement?.crm_orders?.order_reference).toBe(
          "ORD-2025-00001"
        );
      }
    });
  });

  describe("listAgreementsAction", () => {
    const defaultQuery: AgreementQueryInput = {
      page: 1,
      limit: 20,
      sortBy: "created_at",
      sortOrder: "desc",
    };

    it("should list agreements with pagination", async () => {
      setupAdminAuth();
      mockAgreementService.listAgreements.mockResolvedValue({
        data: [mockAgreement],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await listAgreementsAction(defaultQuery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreements).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.totalPages).toBe(1);
      }
    });

    it("should filter by status", async () => {
      setupAdminAuth();
      mockAgreementService.listAgreements.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await listAgreementsAction({ ...defaultQuery, status: "active" });

      expect(mockAgreementService.listAgreements).toHaveBeenCalledWith(
        TEST_PROVIDER_ID,
        expect.objectContaining({ status: "active" }),
        1,
        20
      );
    });

    it("should filter by agreement type", async () => {
      setupAdminAuth();
      mockAgreementService.listAgreements.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      await listAgreementsAction({ ...defaultQuery, agreementType: "msa" });

      expect(mockAgreementService.listAgreements).toHaveBeenCalledWith(
        TEST_PROVIDER_ID,
        expect.objectContaining({ agreement_type: "msa" }),
        1,
        20
      );
    });
  });

  describe("getAgreementsByOrderAction", () => {
    it("should get agreements by order", async () => {
      setupAdminAuth();
      mockAgreementService.getAgreementsByOrder.mockResolvedValue([
        mockAgreement,
      ]);

      const result = await getAgreementsByOrderAction(TEST_ORDER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.agreements).toHaveLength(1);
        expect(result.agreements[0]?.order_id).toBe(TEST_ORDER_ID);
      }
    });

    it("should return error for invalid order ID", async () => {
      setupAdminAuth();

      const result = await getAgreementsByOrderAction("invalid-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid order ID");
      }
    });
  });

  describe("getExpiringAgreementsAction", () => {
    it("should get expiring agreements with default days", async () => {
      setupAdminAuth();
      mockAgreementService.getExpiringSoonAgreements.mockResolvedValue([
        mockAgreement,
      ]);

      const result = await getExpiringAgreementsAction();

      expect(result.success).toBe(true);
      expect(
        mockAgreementService.getExpiringSoonAgreements
      ).toHaveBeenCalledWith(TEST_PROVIDER_ID, 30);
    });

    it("should get expiring agreements with custom days", async () => {
      setupAdminAuth();
      mockAgreementService.getExpiringSoonAgreements.mockResolvedValue([
        mockAgreement,
      ]);

      await getExpiringAgreementsAction(60);

      expect(
        mockAgreementService.getExpiringSoonAgreements
      ).toHaveBeenCalledWith(TEST_PROVIDER_ID, 60);
    });

    it("should return error for invalid days", async () => {
      setupAdminAuth();

      const result = await getExpiringAgreementsAction(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Days must be between 1 and 365");
      }
    });
  });

  // ===========================================================================
  // STATS ACTIONS
  // ===========================================================================

  describe("getAgreementStatsAction", () => {
    it("should get agreement stats", async () => {
      setupAdminAuth();
      mockAgreementService.countByStatus.mockResolvedValue({
        draft: 5,
        active: 10,
        expired: 2,
      });
      mockAgreementService.countByType.mockResolvedValue({
        msa: 12,
        sla: 5,
      });
      mockAgreementService.getAverageTimeToSignature.mockResolvedValue(7.5);

      const result = await getAgreementStatsAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.stats.byStatus.active).toBe(10);
        expect(result.stats.byType.msa).toBe(12);
        expect(result.stats.averageTimeToSignature).toBe(7.5);
      }
    });

    it("should require authentication", async () => {
      setupNoAuth();

      const result = await getAgreementStatsAction();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("AUTH: Not authenticated");
      }
    });
  });

  // ===========================================================================
  // AUTH PATTERNS (Cross-cutting)
  // ===========================================================================

  describe("Admin Actions Auth Patterns", () => {
    const allActions = [
      {
        name: "createAgreementAction",
        fn: (): Promise<unknown> =>
          createAgreementAction(createValidAgreementInput()),
      },
      {
        name: "updateAgreementAction",
        fn: (): Promise<unknown> =>
          updateAgreementAction(TEST_AGREEMENT_ID, { governingLaw: "UK Law" }),
      },
      {
        name: "deleteAgreementAction",
        fn: (): Promise<unknown> =>
          deleteAgreementAction({
            agreementId: TEST_AGREEMENT_ID,
            reason: "Test deletion",
          }),
      },
      {
        name: "sendForSignatureAction",
        fn: (): Promise<unknown> => sendForSignatureAction(TEST_AGREEMENT_ID),
      },
      {
        name: "recordClientSignatureAction",
        fn: (): Promise<unknown> =>
          recordClientSignatureAction({
            agreementId: TEST_AGREEMENT_ID,
            signatoryName: "John Doe",
            signatoryEmail: "john@example.com",
          }),
      },
      {
        name: "recordProviderSignatureAction",
        fn: (): Promise<unknown> =>
          recordProviderSignatureAction({
            agreementId: TEST_AGREEMENT_ID,
            signatoryId: TEST_SIGNATORY_ID,
          }),
      },
      {
        name: "activateAgreementAction",
        fn: (): Promise<unknown> => activateAgreementAction(TEST_AGREEMENT_ID),
      },
      {
        name: "terminateAgreementAction",
        fn: (): Promise<unknown> =>
          terminateAgreementAction({
            agreementId: TEST_AGREEMENT_ID,
            reason: "Test termination",
          }),
      },
      {
        name: "createNewVersionAction",
        fn: (): Promise<unknown> =>
          createNewVersionAction({ originalAgreementId: TEST_AGREEMENT_ID }),
      },
      {
        name: "getAgreementAction",
        fn: (): Promise<unknown> => getAgreementAction(TEST_AGREEMENT_ID),
      },
      {
        name: "getAgreementWithRelationsAction",
        fn: (): Promise<unknown> =>
          getAgreementWithRelationsAction(TEST_AGREEMENT_ID),
      },
      {
        name: "listAgreementsAction",
        fn: (): Promise<unknown> => listAgreementsAction(),
      },
      {
        name: "getAgreementsByOrderAction",
        fn: (): Promise<unknown> => getAgreementsByOrderAction(TEST_ORDER_ID),
      },
      {
        name: "getExpiringAgreementsAction",
        fn: (): Promise<unknown> => getExpiringAgreementsAction(),
      },
      {
        name: "getAgreementStatsAction",
        fn: (): Promise<unknown> => getAgreementStatsAction(),
      },
    ];

    for (const { name, fn } of allActions) {
      it(`${name} should require authentication`, async () => {
        setupNoAuth();
        const result = (await fn()) as { success: boolean; error?: string };
        expect(result.success).toBe(false);
        expect(result.error).toBe("AUTH: Not authenticated");
      });

      it(`${name} should require admin org`, async () => {
        setupWrongOrg();
        const result = (await fn()) as { success: boolean; error?: string };
        expect(result.success).toBe(false);
        expect(result.error).toBe("AUTH: Not a headquarters organization");
      });
    }
  });

  // ===========================================================================
  // PROVIDER ISOLATION
  // ===========================================================================

  describe("Provider Isolation", () => {
    it("createAgreementAction should pass provider_id from context to service", async () => {
      setupAdminAuth();
      mockAgreementService.createAgreement.mockResolvedValue(mockAgreement);

      await createAgreementAction(createValidAgreementInput());

      expect(mockAgreementService.createAgreement).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: TEST_PROVIDER_ID,
        })
      );
    });

    it("getAgreementAction should pass provider_id to service", async () => {
      setupAdminAuth();
      mockAgreementService.getAgreement.mockResolvedValue(mockAgreement);

      await getAgreementAction(TEST_AGREEMENT_ID);

      expect(mockAgreementService.getAgreement).toHaveBeenCalledWith(
        TEST_AGREEMENT_ID,
        TEST_PROVIDER_ID
      );
    });
  });

  // ===========================================================================
  // AUDIT LOGGING
  // ===========================================================================

  describe("Audit Logging", () => {
    it("createAgreementAction should create audit log", async () => {
      setupAdminAuth();
      mockAgreementService.createAgreement.mockResolvedValue(mockAgreement);

      await createAgreementAction(createValidAgreementInput());

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenant_id: TEST_TENANT_UUID,
          member_id: TEST_MEMBER_UUID,
          entity: "crm_agreement",
          entity_id: TEST_AGREEMENT_ID,
          action: "CREATE",
        }),
      });
    });

    it("terminateAgreementAction should create audit log with warning severity", async () => {
      setupAdminAuth();
      mockAgreementService.terminateAgreement.mockResolvedValue({
        ...mockAgreement,
        status: "terminated" as AgreementStatus,
      });

      await terminateAgreementAction({
        agreementId: TEST_AGREEMENT_ID,
        reason: "Test termination for testing",
      });

      expect(mockDb.adm_audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity: "crm_agreement",
          entity_id: TEST_AGREEMENT_ID,
          action: "TERMINATE",
          severity: "warning",
        }),
      });
    });

    it("should not create audit log if UUIDs are missing", async () => {
      setupAdminAuth();
      mockGetAuditLogUuids.mockResolvedValue({
        tenantUuid: null,
        memberUuid: null,
      });
      mockAgreementService.createAgreement.mockResolvedValue(mockAgreement);

      await createAgreementAction(createValidAgreementInput());

      expect(mockDb.adm_audit_logs.create).not.toHaveBeenCalled();
    });
  });
});
