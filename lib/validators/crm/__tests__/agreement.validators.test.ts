/**
 * Agreement Validators Tests
 *
 * Comprehensive tests for agreement validation schemas.
 * Tests cover happy paths, validation errors, edge cases,
 * Prisma ENUM alignment, and status transition validation.
 *
 * @module lib/validators/crm/__tests__/agreement.validators.test
 */

import { describe, it, expect } from "vitest";
import {
  // Constants
  AGREEMENT_TYPES,
  AGREEMENT_STATUSES,
  SIGNATURE_METHODS,
  SIGNATURE_PROVIDERS,
  VALID_AGREEMENT_STATUS_TRANSITIONS,
  // Base Schemas
  agreementTypeSchema,
  agreementStatusSchema,
  signatureMethodSchema,
  // API Schemas
  CreateAgreementSchema,
  UpdateAgreementSchema,
  RecordClientSignatureSchema,
  RecordProviderSignatureSchema,
  TerminateAgreementSchema,
  DeleteAgreementSchema,
  CreateNewVersionSchema,
  AgreementQuerySchema,
  AgreementStatusUpdateSchema,
  // Form Schemas
  CreateAgreementFormSchema,
  RecordClientSignatureFormSchema,
  TerminateAgreementFormSchema,
  // Types
  type AgreementStatus,
} from "../agreement.validators";

// =============================================================================
// HELPER DATA
// =============================================================================

const validUuid = "123e4567-e89b-12d3-a456-426614174000";
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
const _pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday (reserved for future tests)

const validAgreement = {
  orderId: validUuid,
  agreementType: "msa" as const,
};

const validAgreementFull = {
  orderId: validUuid,
  agreementType: "msa" as const,
  effectiveDate: new Date(),
  expiryDate: futureDate,
  signatureMethod: "electronic" as const,
  signatureProvider: "docusign",
  clientSignatoryName: "John Doe",
  clientSignatoryEmail: "john@company.com",
  clientSignatoryTitle: "CEO",
  providerSignatoryId: validUuid,
  documentUrl: "https://docs.example.com/agreement.pdf",
  termsVersion: "v1.0",
  governingLaw: "French Law",
  jurisdiction: "Paris, France",
  internalNotes: "Test agreement",
};

const validClientSignature = {
  agreementId: validUuid,
  signatoryName: "John Doe",
  signatoryEmail: "john@company.com",
};

const validProviderSignature = {
  agreementId: validUuid,
  signatoryId: validUuid,
};

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe("Constants", () => {
  describe("AGREEMENT_TYPES", () => {
    it("contains all 7 valid types", () => {
      expect(AGREEMENT_TYPES).toHaveLength(7);
      expect(AGREEMENT_TYPES).toContain("msa");
      expect(AGREEMENT_TYPES).toContain("sla");
      expect(AGREEMENT_TYPES).toContain("dpa");
      expect(AGREEMENT_TYPES).toContain("nda");
      expect(AGREEMENT_TYPES).toContain("sow");
      expect(AGREEMENT_TYPES).toContain("addendum");
      expect(AGREEMENT_TYPES).toContain("other");
    });

    it("matches Prisma agreement_type enum", () => {
      // Prisma schema.prisma:6151-6159
      expect(AGREEMENT_TYPES).toEqual([
        "msa",
        "sla",
        "dpa",
        "nda",
        "sow",
        "addendum",
        "other",
      ]);
    });
  });

  describe("AGREEMENT_STATUSES", () => {
    it("contains all 8 valid statuses", () => {
      expect(AGREEMENT_STATUSES).toHaveLength(8);
      expect(AGREEMENT_STATUSES).toContain("draft");
      expect(AGREEMENT_STATUSES).toContain("pending_review");
      expect(AGREEMENT_STATUSES).toContain("pending_signature");
      expect(AGREEMENT_STATUSES).toContain("signed");
      expect(AGREEMENT_STATUSES).toContain("active");
      expect(AGREEMENT_STATUSES).toContain("expired");
      expect(AGREEMENT_STATUSES).toContain("terminated");
      expect(AGREEMENT_STATUSES).toContain("superseded");
    });

    it("matches Prisma agreement_status enum", () => {
      // Prisma schema.prisma:6161-6170
      expect(AGREEMENT_STATUSES).toEqual([
        "draft",
        "pending_review",
        "pending_signature",
        "signed",
        "active",
        "expired",
        "terminated",
        "superseded",
      ]);
    });
  });

  describe("SIGNATURE_METHODS", () => {
    it("contains all 7 valid methods", () => {
      expect(SIGNATURE_METHODS).toHaveLength(7);
      expect(SIGNATURE_METHODS).toContain("digital");
      expect(SIGNATURE_METHODS).toContain("wet_signature");
      expect(SIGNATURE_METHODS).toContain("app");
      expect(SIGNATURE_METHODS).toContain("email");
      expect(SIGNATURE_METHODS).toContain("electronic");
      expect(SIGNATURE_METHODS).toContain("wet_ink");
      expect(SIGNATURE_METHODS).toContain("click_wrap");
    });

    it("matches Prisma signature_method enum", () => {
      // Prisma schema.prisma:5879-5887
      expect(SIGNATURE_METHODS).toEqual([
        "digital",
        "wet_signature",
        "app",
        "email",
        "electronic",
        "wet_ink",
        "click_wrap",
      ]);
    });
  });

  describe("SIGNATURE_PROVIDERS", () => {
    it("contains common signature providers", () => {
      expect(SIGNATURE_PROVIDERS).toContain("docusign");
      expect(SIGNATURE_PROVIDERS).toContain("hellosign");
      expect(SIGNATURE_PROVIDERS).toContain("adobe_sign");
      expect(SIGNATURE_PROVIDERS).toContain("pandadoc");
    });
  });

  describe("VALID_AGREEMENT_STATUS_TRANSITIONS", () => {
    it("draft can transition to pending_review or pending_signature", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.draft).toContain(
        "pending_review"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.draft).toContain(
        "pending_signature"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.draft).toHaveLength(2);
    });

    it("pending_review can transition to pending_signature or draft", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_review).toContain(
        "pending_signature"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_review).toContain(
        "draft"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_review).toHaveLength(2);
    });

    it("pending_signature can transition to signed, expired, or terminated", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_signature).toContain(
        "signed"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_signature).toContain(
        "expired"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_signature).toContain(
        "terminated"
      );
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.pending_signature).toHaveLength(
        3
      );
    });

    it("signed can transition to active or terminated", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.signed).toContain("active");
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.signed).toContain("terminated");
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.signed).toHaveLength(2);
    });

    it("active can transition to expired, terminated, or superseded", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.active).toContain("expired");
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.active).toContain("terminated");
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.active).toContain("superseded");
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.active).toHaveLength(3);
    });

    it("expired has no valid transitions (terminal state)", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.expired).toEqual([]);
    });

    it("terminated has no valid transitions (terminal state)", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.terminated).toEqual([]);
    });

    it("superseded has no valid transitions (terminal state)", () => {
      expect(VALID_AGREEMENT_STATUS_TRANSITIONS.superseded).toEqual([]);
    });
  });
});

// =============================================================================
// BASE SCHEMAS TESTS
// =============================================================================

describe("Base Schemas", () => {
  describe("agreementTypeSchema", () => {
    it("accepts 'msa'", () => {
      expect(() => agreementTypeSchema.parse("msa")).not.toThrow();
    });

    it("accepts 'sla'", () => {
      expect(() => agreementTypeSchema.parse("sla")).not.toThrow();
    });

    it("accepts 'dpa'", () => {
      expect(() => agreementTypeSchema.parse("dpa")).not.toThrow();
    });

    it("accepts 'nda'", () => {
      expect(() => agreementTypeSchema.parse("nda")).not.toThrow();
    });

    it("accepts 'sow'", () => {
      expect(() => agreementTypeSchema.parse("sow")).not.toThrow();
    });

    it("accepts 'addendum'", () => {
      expect(() => agreementTypeSchema.parse("addendum")).not.toThrow();
    });

    it("accepts 'other'", () => {
      expect(() => agreementTypeSchema.parse("other")).not.toThrow();
    });

    it("rejects invalid type", () => {
      expect(() => agreementTypeSchema.parse("invalid")).toThrow();
    });

    it("rejects empty string", () => {
      expect(() => agreementTypeSchema.parse("")).toThrow();
    });
  });

  describe("agreementStatusSchema", () => {
    it("accepts 'draft'", () => {
      expect(() => agreementStatusSchema.parse("draft")).not.toThrow();
    });

    it("accepts 'active'", () => {
      expect(() => agreementStatusSchema.parse("active")).not.toThrow();
    });

    it("accepts 'pending_signature'", () => {
      expect(() =>
        agreementStatusSchema.parse("pending_signature")
      ).not.toThrow();
    });

    it("accepts 'superseded'", () => {
      expect(() => agreementStatusSchema.parse("superseded")).not.toThrow();
    });

    it("rejects invalid status", () => {
      expect(() => agreementStatusSchema.parse("invalid")).toThrow();
    });
  });

  describe("signatureMethodSchema", () => {
    it("accepts 'electronic'", () => {
      expect(() => signatureMethodSchema.parse("electronic")).not.toThrow();
    });

    it("accepts 'wet_ink'", () => {
      expect(() => signatureMethodSchema.parse("wet_ink")).not.toThrow();
    });

    it("accepts 'click_wrap'", () => {
      expect(() => signatureMethodSchema.parse("click_wrap")).not.toThrow();
    });

    it("accepts 'digital'", () => {
      expect(() => signatureMethodSchema.parse("digital")).not.toThrow();
    });

    it("accepts 'wet_signature'", () => {
      expect(() => signatureMethodSchema.parse("wet_signature")).not.toThrow();
    });

    it("rejects invalid method", () => {
      expect(() => signatureMethodSchema.parse("invalid")).toThrow();
    });
  });
});

// =============================================================================
// CREATE AGREEMENT SCHEMA TESTS
// =============================================================================

describe("CreateAgreementSchema", () => {
  describe("Happy Path", () => {
    it("accepts valid agreement with required fields only", () => {
      const result = CreateAgreementSchema.parse(validAgreement);
      expect(result.orderId).toBe(validUuid);
      expect(result.agreementType).toBe("msa");
    });

    it("accepts agreement with all optional fields", () => {
      const result = CreateAgreementSchema.parse(validAgreementFull);
      expect(result.clientSignatoryName).toBe("John Doe");
      expect(result.governingLaw).toBe("French Law");
      expect(result.jurisdiction).toBe("Paris, France");
    });

    it("applies default signatureMethod 'electronic'", () => {
      const result = CreateAgreementSchema.parse(validAgreement);
      expect(result.signatureMethod).toBe("electronic");
    });

    it("accepts all agreement types", () => {
      AGREEMENT_TYPES.forEach((type) => {
        const result = CreateAgreementSchema.parse({
          orderId: validUuid,
          agreementType: type,
        });
        expect(result.agreementType).toBe(type);
      });
    });
  });

  describe("Required Fields", () => {
    it("rejects missing orderId", () => {
      const agreement = {
        agreementType: "msa" as const,
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects missing agreementType", () => {
      const agreement = {
        orderId: validUuid,
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects invalid orderId UUID", () => {
      const agreement = {
        ...validAgreement,
        orderId: "not-a-uuid",
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects empty orderId", () => {
      const agreement = {
        ...validAgreement,
        orderId: "",
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects invalid agreementType", () => {
      const agreement = {
        orderId: validUuid,
        agreementType: "invalid",
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });
  });

  describe("Date Validations", () => {
    it("accepts effectiveDate without expiryDate", () => {
      const agreement = {
        ...validAgreement,
        effectiveDate: new Date(),
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.effectiveDate).toBeTruthy();
    });

    it("accepts expiryDate without effectiveDate", () => {
      const agreement = {
        ...validAgreement,
        expiryDate: futureDate,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.expiryDate).toBeTruthy();
    });

    it("accepts expiryDate after effectiveDate", () => {
      const effectiveDate = new Date();
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const agreement = {
        ...validAgreement,
        effectiveDate,
        expiryDate,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.effectiveDate).toBeTruthy();
      expect(result.expiryDate).toBeTruthy();
    });

    it("rejects expiryDate before effectiveDate", () => {
      const effectiveDate = futureDate;
      const expiryDate = new Date();
      const agreement = {
        ...validAgreement,
        effectiveDate,
        expiryDate,
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects expiryDate equal to effectiveDate", () => {
      const sameDate = new Date();
      const agreement = {
        ...validAgreement,
        effectiveDate: sameDate,
        expiryDate: sameDate,
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("accepts null effectiveDate", () => {
      const agreement = {
        ...validAgreement,
        effectiveDate: null,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.effectiveDate).toBeNull();
    });

    it("accepts null expiryDate", () => {
      const agreement = {
        ...validAgreement,
        expiryDate: null,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.expiryDate).toBeNull();
    });
  });

  describe("Email Validation", () => {
    it("accepts valid clientSignatoryEmail", () => {
      const agreement = {
        ...validAgreement,
        clientSignatoryEmail: "john@company.com",
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.clientSignatoryEmail).toBe("john@company.com");
    });

    it("rejects invalid clientSignatoryEmail", () => {
      const agreement = {
        ...validAgreement,
        clientSignatoryEmail: "not-an-email",
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("accepts null clientSignatoryEmail", () => {
      const agreement = {
        ...validAgreement,
        clientSignatoryEmail: null,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.clientSignatoryEmail).toBeNull();
    });
  });

  describe("URL Validation", () => {
    it("accepts valid documentUrl", () => {
      const agreement = {
        ...validAgreement,
        documentUrl: "https://docs.example.com/agreement.pdf",
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.documentUrl).toBe("https://docs.example.com/agreement.pdf");
    });

    it("rejects invalid documentUrl", () => {
      const agreement = {
        ...validAgreement,
        documentUrl: "not-a-url",
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("accepts null documentUrl", () => {
      const agreement = {
        ...validAgreement,
        documentUrl: null,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.documentUrl).toBeNull();
    });
  });

  describe("String Length Limits", () => {
    it("rejects clientSignatoryName exceeding 200 chars", () => {
      const agreement = {
        ...validAgreement,
        clientSignatoryName: "x".repeat(201),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects clientSignatoryTitle exceeding 100 chars", () => {
      const agreement = {
        ...validAgreement,
        clientSignatoryTitle: "x".repeat(101),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects internalNotes exceeding 5000 chars", () => {
      const agreement = {
        ...validAgreement,
        internalNotes: "x".repeat(5001),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects jurisdiction exceeding 200 chars", () => {
      const agreement = {
        ...validAgreement,
        jurisdiction: "x".repeat(201),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects governingLaw exceeding 100 chars", () => {
      const agreement = {
        ...validAgreement,
        governingLaw: "x".repeat(101),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects signatureProvider exceeding 50 chars", () => {
      const agreement = {
        ...validAgreement,
        signatureProvider: "x".repeat(51),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("rejects termsVersion exceeding 20 chars", () => {
      const agreement = {
        ...validAgreement,
        termsVersion: "x".repeat(21),
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });
  });

  describe("Provider Signatory ID Validation", () => {
    it("accepts valid providerSignatoryId UUID", () => {
      const agreement = {
        ...validAgreement,
        providerSignatoryId: validUuid,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.providerSignatoryId).toBe(validUuid);
    });

    it("rejects invalid providerSignatoryId UUID", () => {
      const agreement = {
        ...validAgreement,
        providerSignatoryId: "not-a-uuid",
      };
      expect(() => CreateAgreementSchema.parse(agreement)).toThrow();
    });

    it("accepts null providerSignatoryId", () => {
      const agreement = {
        ...validAgreement,
        providerSignatoryId: null,
      };
      const result = CreateAgreementSchema.parse(agreement);
      expect(result.providerSignatoryId).toBeNull();
    });
  });
});

// =============================================================================
// UPDATE AGREEMENT SCHEMA TESTS
// =============================================================================

describe("UpdateAgreementSchema", () => {
  it("accepts empty object (no updates)", () => {
    const result = UpdateAgreementSchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts partial update with one field", () => {
    const result = UpdateAgreementSchema.parse({ governingLaw: "Swiss Law" });
    expect(result.governingLaw).toBe("Swiss Law");
  });

  it("accepts full update with all fields", () => {
    const update = {
      effectiveDate: new Date(),
      expiryDate: futureDate,
      signatureMethod: "wet_ink" as const,
      signatureProvider: "docusign",
      clientSignatoryName: "Jane Doe",
      clientSignatoryEmail: "jane@company.com",
      clientSignatoryTitle: "CFO",
      providerSignatoryId: validUuid,
      documentUrl: "https://docs.example.com/updated.pdf",
      termsVersion: "v2.0",
      governingLaw: "German Law",
      jurisdiction: "Berlin, Germany",
      internalNotes: "Updated agreement",
    };
    const result = UpdateAgreementSchema.parse(update);
    expect(result.clientSignatoryName).toBe("Jane Doe");
    expect(result.governingLaw).toBe("German Law");
  });

  it("validates email format", () => {
    expect(() =>
      UpdateAgreementSchema.parse({ clientSignatoryEmail: "invalid" })
    ).toThrow();
  });

  it("validates URL format", () => {
    expect(() =>
      UpdateAgreementSchema.parse({ documentUrl: "not-a-url" })
    ).toThrow();
  });

  it("accepts nullable fields", () => {
    const result = UpdateAgreementSchema.parse({
      effectiveDate: null,
      clientSignatoryEmail: null,
      documentUrl: null,
    });
    expect(result.effectiveDate).toBeNull();
    expect(result.clientSignatoryEmail).toBeNull();
    expect(result.documentUrl).toBeNull();
  });

  it("validates signature method", () => {
    expect(() =>
      UpdateAgreementSchema.parse({ signatureMethod: "invalid" })
    ).toThrow();
  });
});

// =============================================================================
// RECORD CLIENT SIGNATURE SCHEMA TESTS
// =============================================================================

describe("RecordClientSignatureSchema", () => {
  describe("Happy Path", () => {
    it("accepts valid signature with required fields", () => {
      const result = RecordClientSignatureSchema.parse(validClientSignature);
      expect(result.signatoryName).toBe("John Doe");
      expect(result.signatoryEmail).toBe("john@company.com");
    });

    it("accepts signature with all fields", () => {
      const signature = {
        ...validClientSignature,
        signatoryTitle: "CEO",
        signatureIp: "192.168.1.1",
      };
      const result = RecordClientSignatureSchema.parse(signature);
      expect(result.signatoryTitle).toBe("CEO");
      expect(result.signatureIp).toBe("192.168.1.1");
    });
  });

  describe("Required Fields", () => {
    it("rejects missing agreementId", () => {
      const signature = {
        signatoryName: "John Doe",
        signatoryEmail: "john@company.com",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });

    it("rejects missing signatoryName", () => {
      const signature = {
        agreementId: validUuid,
        signatoryEmail: "john@company.com",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });

    it("rejects missing signatoryEmail", () => {
      const signature = {
        agreementId: validUuid,
        signatoryName: "John Doe",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });

    it("rejects empty signatoryName", () => {
      const signature = {
        ...validClientSignature,
        signatoryName: "",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });

    it("rejects invalid agreementId UUID", () => {
      const signature = {
        ...validClientSignature,
        agreementId: "not-a-uuid",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });
  });

  describe("Email Validation", () => {
    it("accepts valid email", () => {
      const result = RecordClientSignatureSchema.parse(validClientSignature);
      expect(result.signatoryEmail).toBe("john@company.com");
    });

    it("rejects invalid email", () => {
      const signature = {
        ...validClientSignature,
        signatoryEmail: "not-an-email",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });
  });

  describe("IP Address", () => {
    it("accepts valid IPv4 address", () => {
      const signature = {
        ...validClientSignature,
        signatureIp: "192.168.1.1",
      };
      const result = RecordClientSignatureSchema.parse(signature);
      expect(result.signatureIp).toBe("192.168.1.1");
    });

    it("accepts valid IPv6 address", () => {
      const signature = {
        ...validClientSignature,
        signatureIp: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      };
      const result = RecordClientSignatureSchema.parse(signature);
      expect(result.signatureIp).toBeTruthy();
    });

    it("accepts null signatureIp", () => {
      const signature = {
        ...validClientSignature,
        signatureIp: null,
      };
      const result = RecordClientSignatureSchema.parse(signature);
      expect(result.signatureIp).toBeNull();
    });

    it("rejects signatureIp exceeding 45 chars", () => {
      const signature = {
        ...validClientSignature,
        signatureIp: "x".repeat(46),
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });
  });

  describe("String Length Limits", () => {
    it("rejects signatoryName exceeding 200 chars", () => {
      const signature = {
        ...validClientSignature,
        signatoryName: "x".repeat(201),
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });

    it("rejects signatoryEmail exceeding 255 chars", () => {
      const signature = {
        ...validClientSignature,
        signatoryEmail: "a".repeat(250) + "@b.com",
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });

    it("rejects signatoryTitle exceeding 100 chars", () => {
      const signature = {
        ...validClientSignature,
        signatoryTitle: "x".repeat(101),
      };
      expect(() => RecordClientSignatureSchema.parse(signature)).toThrow();
    });
  });
});

// =============================================================================
// RECORD PROVIDER SIGNATURE SCHEMA TESTS
// =============================================================================

describe("RecordProviderSignatureSchema", () => {
  it("accepts valid signature with required fields", () => {
    const result = RecordProviderSignatureSchema.parse(validProviderSignature);
    expect(result.agreementId).toBe(validUuid);
    expect(result.signatoryId).toBe(validUuid);
  });

  it("accepts signature with optional overrides", () => {
    const signature = {
      ...validProviderSignature,
      signatoryName: "Jane Smith",
      signatoryTitle: "Sales Director",
    };
    const result = RecordProviderSignatureSchema.parse(signature);
    expect(result.signatoryName).toBe("Jane Smith");
    expect(result.signatoryTitle).toBe("Sales Director");
  });

  it("rejects missing agreementId", () => {
    const signature = {
      signatoryId: validUuid,
    };
    expect(() => RecordProviderSignatureSchema.parse(signature)).toThrow();
  });

  it("rejects missing signatoryId", () => {
    const signature = {
      agreementId: validUuid,
    };
    expect(() => RecordProviderSignatureSchema.parse(signature)).toThrow();
  });

  it("rejects invalid agreementId UUID", () => {
    const signature = {
      ...validProviderSignature,
      agreementId: "not-a-uuid",
    };
    expect(() => RecordProviderSignatureSchema.parse(signature)).toThrow();
  });

  it("rejects invalid signatoryId UUID", () => {
    const signature = {
      ...validProviderSignature,
      signatoryId: "not-a-uuid",
    };
    expect(() => RecordProviderSignatureSchema.parse(signature)).toThrow();
  });

  it("accepts null optional fields", () => {
    const signature = {
      ...validProviderSignature,
      signatoryName: null,
      signatoryTitle: null,
    };
    const result = RecordProviderSignatureSchema.parse(signature);
    expect(result.signatoryName).toBeNull();
    expect(result.signatoryTitle).toBeNull();
  });

  it("rejects signatoryName exceeding 200 chars", () => {
    const signature = {
      ...validProviderSignature,
      signatoryName: "x".repeat(201),
    };
    expect(() => RecordProviderSignatureSchema.parse(signature)).toThrow();
  });

  it("rejects signatoryTitle exceeding 100 chars", () => {
    const signature = {
      ...validProviderSignature,
      signatoryTitle: "x".repeat(101),
    };
    expect(() => RecordProviderSignatureSchema.parse(signature)).toThrow();
  });
});

// =============================================================================
// TERMINATE AGREEMENT SCHEMA TESTS
// =============================================================================

describe("TerminateAgreementSchema", () => {
  it("accepts valid termination with reason", () => {
    const input = {
      agreementId: validUuid,
      reason: "Client requested early termination",
    };
    const result = TerminateAgreementSchema.parse(input);
    expect(result.agreementId).toBe(validUuid);
    expect(result.reason).toBe("Client requested early termination");
  });

  it("rejects missing agreementId", () => {
    const input = {
      reason: "Some reason",
    };
    expect(() => TerminateAgreementSchema.parse(input)).toThrow();
  });

  it("rejects missing reason", () => {
    const input = {
      agreementId: validUuid,
    };
    expect(() => TerminateAgreementSchema.parse(input)).toThrow();
  });

  it("rejects empty reason", () => {
    const input = {
      agreementId: validUuid,
      reason: "",
    };
    expect(() => TerminateAgreementSchema.parse(input)).toThrow();
  });

  it("rejects reason exceeding 2000 chars", () => {
    const input = {
      agreementId: validUuid,
      reason: "x".repeat(2001),
    };
    expect(() => TerminateAgreementSchema.parse(input)).toThrow();
  });

  it("rejects invalid agreementId UUID", () => {
    const input = {
      agreementId: "not-a-uuid",
      reason: "Some reason",
    };
    expect(() => TerminateAgreementSchema.parse(input)).toThrow();
  });
});

// =============================================================================
// DELETE AGREEMENT SCHEMA TESTS
// =============================================================================

describe("DeleteAgreementSchema", () => {
  it("accepts valid deletion with reason", () => {
    const input = {
      agreementId: validUuid,
      reason: "Created in error - duplicate agreement",
    };
    const result = DeleteAgreementSchema.parse(input);
    expect(result.agreementId).toBe(validUuid);
    expect(result.reason).toBe("Created in error - duplicate agreement");
  });

  it("rejects missing reason", () => {
    const input = {
      agreementId: validUuid,
    };
    expect(() => DeleteAgreementSchema.parse(input)).toThrow();
  });

  it("rejects empty reason", () => {
    const input = {
      agreementId: validUuid,
      reason: "",
    };
    expect(() => DeleteAgreementSchema.parse(input)).toThrow();
  });

  it("rejects invalid agreementId UUID", () => {
    const input = {
      agreementId: "not-a-uuid",
      reason: "Some reason",
    };
    expect(() => DeleteAgreementSchema.parse(input)).toThrow();
  });

  it("rejects reason exceeding 2000 chars", () => {
    const input = {
      agreementId: validUuid,
      reason: "x".repeat(2001),
    };
    expect(() => DeleteAgreementSchema.parse(input)).toThrow();
  });
});

// =============================================================================
// CREATE NEW VERSION SCHEMA TESTS
// =============================================================================

describe("CreateNewVersionSchema", () => {
  it("accepts valid originalAgreementId UUID", () => {
    const input = {
      originalAgreementId: validUuid,
    };
    const result = CreateNewVersionSchema.parse(input);
    expect(result.originalAgreementId).toBe(validUuid);
  });

  it("rejects missing originalAgreementId", () => {
    const input = {};
    expect(() => CreateNewVersionSchema.parse(input)).toThrow();
  });

  it("rejects invalid originalAgreementId UUID", () => {
    const input = {
      originalAgreementId: "not-a-uuid",
    };
    expect(() => CreateNewVersionSchema.parse(input)).toThrow();
  });

  it("rejects empty string originalAgreementId", () => {
    const input = {
      originalAgreementId: "",
    };
    expect(() => CreateNewVersionSchema.parse(input)).toThrow();
  });
});

// =============================================================================
// AGREEMENT STATUS UPDATE SCHEMA TESTS
// =============================================================================

describe("AgreementStatusUpdateSchema", () => {
  it("accepts valid status update", () => {
    const input = {
      agreementId: validUuid,
      newStatus: "pending_signature" as const,
    };
    const result = AgreementStatusUpdateSchema.parse(input);
    expect(result.agreementId).toBe(validUuid);
    expect(result.newStatus).toBe("pending_signature");
  });

  it("accepts status update with optional reason", () => {
    const input = {
      agreementId: validUuid,
      newStatus: "terminated" as const,
      reason: "Client requested termination",
    };
    const result = AgreementStatusUpdateSchema.parse(input);
    expect(result.reason).toBe("Client requested termination");
  });

  it("rejects missing agreementId", () => {
    const input = {
      newStatus: "active" as const,
    };
    expect(() => AgreementStatusUpdateSchema.parse(input)).toThrow();
  });

  it("rejects missing newStatus", () => {
    const input = {
      agreementId: validUuid,
    };
    expect(() => AgreementStatusUpdateSchema.parse(input)).toThrow();
  });

  it("rejects invalid agreementId UUID", () => {
    const input = {
      agreementId: "not-a-uuid",
      newStatus: "active" as const,
    };
    expect(() => AgreementStatusUpdateSchema.parse(input)).toThrow();
  });

  it("rejects invalid newStatus", () => {
    const input = {
      agreementId: validUuid,
      newStatus: "invalid",
    };
    expect(() => AgreementStatusUpdateSchema.parse(input)).toThrow();
  });

  it("rejects reason exceeding 2000 chars", () => {
    const input = {
      agreementId: validUuid,
      newStatus: "terminated" as const,
      reason: "x".repeat(2001),
    };
    expect(() => AgreementStatusUpdateSchema.parse(input)).toThrow();
  });

  it("accepts all valid statuses", () => {
    AGREEMENT_STATUSES.forEach((status) => {
      const input = {
        agreementId: validUuid,
        newStatus: status,
      };
      const result = AgreementStatusUpdateSchema.parse(input);
      expect(result.newStatus).toBe(status);
    });
  });
});

// =============================================================================
// FORM SCHEMAS TESTS
// =============================================================================

describe("Form Schemas", () => {
  describe("CreateAgreementFormSchema", () => {
    it("accepts string date fields", () => {
      const form = {
        orderId: validUuid,
        agreementType: "msa" as const,
        effectiveDate: "2025-01-01",
        expiryDate: "2026-01-01",
      };
      const result = CreateAgreementFormSchema.parse(form);
      expect(result.effectiveDate).toBe("2025-01-01");
    });

    it("applies default signatureMethod", () => {
      const form = {
        orderId: validUuid,
        agreementType: "msa" as const,
      };
      const result = CreateAgreementFormSchema.parse(form);
      expect(result.signatureMethod).toBe("electronic");
    });

    it("handles empty optional strings", () => {
      const form = {
        orderId: validUuid,
        agreementType: "msa" as const,
        governingLaw: "",
      };
      const result = CreateAgreementFormSchema.parse(form);
      expect(result.governingLaw).toBe("");
    });

    it("handles empty email as valid", () => {
      const form = {
        orderId: validUuid,
        agreementType: "msa" as const,
        clientSignatoryEmail: "",
      };
      const result = CreateAgreementFormSchema.parse(form);
      expect(result.clientSignatoryEmail).toBe("");
    });

    it("handles empty URL as valid", () => {
      const form = {
        orderId: validUuid,
        agreementType: "msa" as const,
        documentUrl: "",
      };
      const result = CreateAgreementFormSchema.parse(form);
      expect(result.documentUrl).toBe("");
    });
  });

  describe("RecordClientSignatureFormSchema", () => {
    it("validates required fields", () => {
      expect(() =>
        RecordClientSignatureFormSchema.parse({
          signatoryEmail: "john@company.com",
        })
      ).toThrow();
    });

    it("accepts valid form data", () => {
      const form = {
        signatoryName: "John Doe",
        signatoryEmail: "john@company.com",
        signatoryTitle: "CEO",
      };
      const result = RecordClientSignatureFormSchema.parse(form);
      expect(result.signatoryName).toBe("John Doe");
    });

    it("validates email format", () => {
      const form = {
        signatoryName: "John Doe",
        signatoryEmail: "invalid-email",
      };
      expect(() => RecordClientSignatureFormSchema.parse(form)).toThrow();
    });
  });

  describe("TerminateAgreementFormSchema", () => {
    it("validates reason required", () => {
      expect(() => TerminateAgreementFormSchema.parse({})).toThrow();
    });

    it("validates reason not empty", () => {
      expect(() =>
        TerminateAgreementFormSchema.parse({ reason: "" })
      ).toThrow();
    });

    it("validates reason max length", () => {
      expect(() =>
        TerminateAgreementFormSchema.parse({ reason: "x".repeat(2001) })
      ).toThrow();
    });

    it("accepts valid reason", () => {
      const result = TerminateAgreementFormSchema.parse({
        reason: "Client requested termination",
      });
      expect(result.reason).toBe("Client requested termination");
    });
  });
});

// =============================================================================
// QUERY SCHEMA TESTS
// =============================================================================

describe("AgreementQuerySchema", () => {
  it("applies default page 1", () => {
    const result = AgreementQuerySchema.parse({});
    expect(result.page).toBe(1);
  });

  it("applies default limit 20", () => {
    const result = AgreementQuerySchema.parse({});
    expect(result.limit).toBe(20);
  });

  it("applies default sortBy 'created_at'", () => {
    const result = AgreementQuerySchema.parse({});
    expect(result.sortBy).toBe("created_at");
  });

  it("applies default sortOrder 'desc'", () => {
    const result = AgreementQuerySchema.parse({});
    expect(result.sortOrder).toBe("desc");
  });

  it("coerces string page to number", () => {
    const result = AgreementQuerySchema.parse({ page: "5" });
    expect(result.page).toBe(5);
    expect(typeof result.page).toBe("number");
  });

  it("validates page >= 1", () => {
    expect(() => AgreementQuerySchema.parse({ page: 0 })).toThrow();
  });

  it("validates limit 1-100", () => {
    expect(() => AgreementQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => AgreementQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("accepts all filter combinations", () => {
    const query = {
      page: 2,
      limit: 50,
      status: "active" as const,
      agreementType: "msa" as const,
      orderId: validUuid,
      signatureMethod: "electronic" as const,
      effectiveFrom: new Date(),
      effectiveTo: futureDate,
      search: "test",
      sortBy: "effective_date" as const,
      sortOrder: "asc" as const,
    };
    const result = AgreementQuerySchema.parse(query);
    expect(result.status).toBe("active");
    expect(result.agreementType).toBe("msa");
  });

  it("validates status filter", () => {
    expect(() => AgreementQuerySchema.parse({ status: "invalid" })).toThrow();
  });

  it("validates agreementType filter", () => {
    expect(() =>
      AgreementQuerySchema.parse({ agreementType: "invalid" })
    ).toThrow();
  });

  it("validates sortBy options", () => {
    expect(() => AgreementQuerySchema.parse({ sortBy: "invalid" })).toThrow();
  });

  it("accepts valid sortBy values", () => {
    const validSortBy = [
      "created_at",
      "updated_at",
      "effective_date",
      "expiry_date",
      "agreement_reference",
    ];
    validSortBy.forEach((sortBy) => {
      const result = AgreementQuerySchema.parse({ sortBy });
      expect(result.sortBy).toBe(sortBy);
    });
  });
});

// =============================================================================
// VALID STATUS TRANSITIONS TESTS
// =============================================================================

describe("Valid Status Transitions", () => {
  const testTransition = (
    from: AgreementStatus,
    to: AgreementStatus,
    expected: boolean
  ) => {
    const isValid = VALID_AGREEMENT_STATUS_TRANSITIONS[from].includes(to);
    expect(isValid).toBe(expected);
  };

  describe("From draft", () => {
    it("CAN transition to pending_review", () => {
      testTransition("draft", "pending_review", true);
    });

    it("CAN transition to pending_signature", () => {
      testTransition("draft", "pending_signature", true);
    });
  });

  describe("From pending_review", () => {
    it("CAN transition to pending_signature", () => {
      testTransition("pending_review", "pending_signature", true);
    });

    it("CAN transition back to draft", () => {
      testTransition("pending_review", "draft", true);
    });
  });

  describe("From pending_signature", () => {
    it("CAN transition to signed", () => {
      testTransition("pending_signature", "signed", true);
    });

    it("CAN transition to expired", () => {
      testTransition("pending_signature", "expired", true);
    });

    it("CAN transition to terminated", () => {
      testTransition("pending_signature", "terminated", true);
    });
  });

  describe("From signed", () => {
    it("CAN transition to active", () => {
      testTransition("signed", "active", true);
    });

    it("CAN transition to terminated", () => {
      testTransition("signed", "terminated", true);
    });
  });

  describe("From active", () => {
    it("CAN transition to expired", () => {
      testTransition("active", "expired", true);
    });

    it("CAN transition to terminated", () => {
      testTransition("active", "terminated", true);
    });

    it("CAN transition to superseded", () => {
      testTransition("active", "superseded", true);
    });
  });
});

// =============================================================================
// INVALID STATUS TRANSITIONS TESTS
// =============================================================================

describe("Invalid Status Transitions", () => {
  const testInvalidTransition = (
    from: AgreementStatus,
    to: AgreementStatus
  ) => {
    const isValid = VALID_AGREEMENT_STATUS_TRANSITIONS[from].includes(to);
    expect(isValid).toBe(false);
  };

  describe("From draft", () => {
    it("CANNOT transition directly to signed", () => {
      testInvalidTransition("draft", "signed");
    });

    it("CANNOT transition directly to active", () => {
      testInvalidTransition("draft", "active");
    });

    it("CANNOT transition to expired", () => {
      testInvalidTransition("draft", "expired");
    });

    it("CANNOT transition to terminated", () => {
      testInvalidTransition("draft", "terminated");
    });

    it("CANNOT transition to superseded", () => {
      testInvalidTransition("draft", "superseded");
    });
  });

  describe("From pending_signature", () => {
    it("CANNOT transition to draft", () => {
      testInvalidTransition("pending_signature", "draft");
    });

    it("CANNOT transition to pending_review", () => {
      testInvalidTransition("pending_signature", "pending_review");
    });

    it("CANNOT transition to active", () => {
      testInvalidTransition("pending_signature", "active");
    });

    it("CANNOT transition to superseded", () => {
      testInvalidTransition("pending_signature", "superseded");
    });
  });

  describe("From signed", () => {
    it("CANNOT transition to draft", () => {
      testInvalidTransition("signed", "draft");
    });

    it("CANNOT transition to pending_review", () => {
      testInvalidTransition("signed", "pending_review");
    });

    it("CANNOT transition to pending_signature", () => {
      testInvalidTransition("signed", "pending_signature");
    });

    it("CANNOT transition to expired", () => {
      testInvalidTransition("signed", "expired");
    });

    it("CANNOT transition to superseded", () => {
      testInvalidTransition("signed", "superseded");
    });
  });

  describe("From active", () => {
    it("CANNOT transition to draft", () => {
      testInvalidTransition("active", "draft");
    });

    it("CANNOT transition to pending_review", () => {
      testInvalidTransition("active", "pending_review");
    });

    it("CANNOT transition to pending_signature", () => {
      testInvalidTransition("active", "pending_signature");
    });

    it("CANNOT transition to signed", () => {
      testInvalidTransition("active", "signed");
    });
  });

  describe("Terminal states (expired)", () => {
    it("CANNOT transition to any status", () => {
      AGREEMENT_STATUSES.forEach((status) => {
        testInvalidTransition("expired", status);
      });
    });
  });

  describe("Terminal states (terminated)", () => {
    it("CANNOT transition to any status", () => {
      AGREEMENT_STATUSES.forEach((status) => {
        testInvalidTransition("terminated", status);
      });
    });
  });

  describe("Terminal states (superseded)", () => {
    it("CANNOT transition to any status", () => {
      AGREEMENT_STATUSES.forEach((status) => {
        testInvalidTransition("superseded", status);
      });
    });
  });
});

// =============================================================================
// PRISMA ENUM ALIGNMENT TESTS
// =============================================================================

describe("Prisma ENUM alignment", () => {
  it("AGREEMENT_TYPES matches Prisma agreement_type enum exactly", () => {
    // Prisma schema.prisma:6151-6159
    expect(AGREEMENT_TYPES).toEqual([
      "msa",
      "sla",
      "dpa",
      "nda",
      "sow",
      "addendum",
      "other",
    ]);
  });

  it("AGREEMENT_STATUSES matches Prisma agreement_status enum exactly", () => {
    // Prisma schema.prisma:6161-6170
    expect(AGREEMENT_STATUSES).toEqual([
      "draft",
      "pending_review",
      "pending_signature",
      "signed",
      "active",
      "expired",
      "terminated",
      "superseded",
    ]);
  });

  it("SIGNATURE_METHODS matches Prisma signature_method enum exactly", () => {
    // Prisma schema.prisma:5879-5887
    expect(SIGNATURE_METHODS).toEqual([
      "digital",
      "wet_signature",
      "app",
      "email",
      "electronic",
      "wet_ink",
      "click_wrap",
    ]);
  });
});

// =============================================================================
// TENANT ID PATTERN TESTS
// =============================================================================

describe("Tenant ID pattern", () => {
  it("CreateAgreementSchema does NOT include tenantId field", () => {
    // tenantId is injected via auth context at action layer
    const result = CreateAgreementSchema.parse(validAgreement);
    expect("tenantId" in result).toBe(false);
  });

  it("CreateAgreementSchema does NOT include createdBy field", () => {
    // createdBy is injected via auth() at action layer
    const result = CreateAgreementSchema.parse(validAgreement);
    expect("createdBy" in result).toBe(false);
  });

  it("accepts agreement without tenantId in input", () => {
    // Should not require tenantId
    expect(() => CreateAgreementSchema.parse(validAgreement)).not.toThrow();
  });
});
