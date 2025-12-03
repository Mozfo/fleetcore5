/**
 * CRM Validators Tests
 *
 * Covers all 10 CRM schemas (7 métier + 3 query) with valid and invalid cases.
 * Test pattern: 2 tests per schema (valid + invalid) = 20 tests total
 */

import { describe, it, expect } from "vitest";
import {
  LeadCreateSchema,
  LeadUpdateSchema,
  LeadQualifySchema,
  LeadQuerySchema,
  OpportunityCreateSchema,
  OpportunityUpdateSchema,
  OpportunityQuerySchema,
  ContractCreateSchema,
  ContractUpdateSchema,
  ContractQuerySchema,
} from "../crm.validators";

// ===== LEAD VALIDATORS (6 tests) =====

describe("LeadCreateSchema", () => {
  it("should validate valid lead creation data", () => {
    const validData = {
      email: "john.doe@acme.com",
      phone: "+33612345678",
      first_name: "John",
      last_name: "Doe",
      fleet_size: "51-100",
      country_code: "fr",
      gdpr_consent: true,
      form_locale: "en",
    };

    const result = LeadCreateSchema.parse(validData);

    expect(result.email).toBe("john.doe@acme.com");
    expect(result.country_code).toBe("FR"); // Transformed to uppercase
    expect(result.gdpr_consent).toBe(true);
  });

  it("should reject invalid lead creation data", () => {
    const invalidData = {
      email: "invalid-email", // Invalid format
      phone: "123", // Too short
      first_name: "J", // Too short
      last_name: "Doe123", // Contains digits
      fleet_size: "invalid-size", // Invalid enum value
      country_code: "FRANCE", // Too long
      gdpr_consent: false,
    };

    expect(() => LeadCreateSchema.parse(invalidData)).toThrow();
  });

  it("should require GDPR consent for EU countries", () => {
    const frenchLeadWithoutConsent = {
      email: "contact@francevtc.fr",
      phone: "+33612345678",
      first_name: "Pierre",
      last_name: "Durand",
      fleet_size: "11-50",
      country_code: "FR",
      gdpr_consent: false, // Should fail
      form_locale: "fr",
    };

    expect(() => LeadCreateSchema.parse(frenchLeadWithoutConsent)).toThrow(
      "consentement RGPD"
    );
  });

  it("should not require GDPR consent for non-EU countries", () => {
    const uaeLead = {
      email: "contact@dubaifleet.ae",
      phone: "+971501234567",
      first_name: "Ahmed",
      last_name: "Hassan",
      fleet_size: "51-100",
      country_code: "AE",
      gdpr_consent: false, // Should pass
      form_locale: "en",
    };

    const result = LeadCreateSchema.parse(uaeLead);
    expect(result.gdpr_consent).toBe(false);
  });
});

describe("LeadUpdateSchema", () => {
  it("should validate partial lead updates", () => {
    const partialUpdate = {
      fleet_size: "11-50",
      gdpr_consent: true,
    };

    const result = LeadUpdateSchema.parse(partialUpdate);
    expect(result.fleet_size).toBe("11-50");
  });

  it("should reject invalid partial updates", () => {
    const invalidUpdate = {
      email: "not-an-email",
      fleet_size: "invalid-range", // Invalid enum
    };

    expect(() => LeadUpdateSchema.parse(invalidUpdate)).toThrow();
  });
});

describe("LeadQualifySchema", () => {
  it("should validate lead qualification", () => {
    const qualification = {
      lead_stage: "sales_qualified",
      qualification_score: 85,
      qualification_notes: "Strong fit",
    };

    const result = LeadQualifySchema.parse(qualification);
    expect(result.qualification_score).toBe(85);
  });

  it("should reject invalid qualification", () => {
    const invalid = {
      lead_stage: "invalid_stage",
      qualification_score: 150, // Exceeds max
    };

    expect(() => LeadQualifySchema.parse(invalid)).toThrow();
  });
});

describe("LeadQuerySchema", () => {
  it("should validate and coerce query parameters", () => {
    const query = {
      page: "2",
      limit: "50",
      sortBy: "email",
      sortOrder: "asc",
      status: "qualified",
    };

    const result = LeadQuerySchema.parse(query);

    expect(result.page).toBe(2); // Coerced to number
    expect(result.limit).toBe(50);
    expect(result.sortBy).toBe("email");
  });

  it("should apply defaults for missing query params", () => {
    const emptyQuery = {};

    const result = LeadQuerySchema.parse(emptyQuery);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe("created_at");
    expect(result.sortOrder).toBe("desc");
  });
});

// ===== OPPORTUNITY VALIDATORS (6 tests) =====

describe("OpportunityCreateSchema", () => {
  it("should validate valid opportunity creation", () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6); // 6 months in the future

    const validData = {
      lead_id: "123e4567-e89b-12d3-a456-426614174000",
      stage: "proposal",
      status: "open",
      expected_value: 50000,
      probability_percent: 60,
      expected_close_date: futureDate,
      currency: "eur",
    };

    const result = OpportunityCreateSchema.parse(validData);
    expect(result.currency).toBe("EUR"); // Transformed to uppercase
    expect(result.probability_percent).toBe(60);
  });

  it("should reject invalid opportunity data", () => {
    const invalidData = {
      lead_id: "invalid-uuid",
      stage: "invalid_stage",
      status: "open",
      expected_value: -1000,
      probability_percent: 150,
      expected_close_date: new Date("2020-01-01"), // Past date
      currency: "EURO", // Invalid length
    };

    expect(() => OpportunityCreateSchema.parse(invalidData)).toThrow();
  });
});

describe("OpportunityUpdateSchema", () => {
  it("should validate partial opportunity updates", () => {
    const update = {
      probability_percent: 75,
      stage: "negotiation",
    };

    const result = OpportunityUpdateSchema.parse(update);
    expect(result.probability_percent).toBe(75);
  });

  it("should reject invalid partial updates", () => {
    const invalid = {
      probability_percent: -10,
    };

    expect(() => OpportunityUpdateSchema.parse(invalid)).toThrow();
  });
});

describe("OpportunityQuerySchema", () => {
  it("should validate opportunity query params", () => {
    const query = {
      page: "1",
      limit: "25",
      stage: "proposal",
      status: "open",
      min_value: "10000",
    };

    const result = OpportunityQuerySchema.parse(query);

    expect(result.page).toBe(1);
    expect(result.min_value).toBe(10000);
    expect(result.stage).toBe("proposal");
  });

  it("should apply defaults", () => {
    const result = OpportunityQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortOrder).toBe("desc");
  });
});

// ===== CONTRACT VALIDATORS (8 tests) =====

describe("ContractCreateSchema", () => {
  it("should validate valid contract creation", () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30); // 30 days in the future
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year after start

    const validData = {
      opportunity_id: "123e4567-e89b-12d3-a456-426614174000",
      start_date: startDate,
      end_date: endDate,
      total_value: 60000,
      billing_cycle: "monthly",
      auto_renew: true,
    };

    const result = ContractCreateSchema.parse(validData);
    expect(result.total_value).toBe(60000);
    expect(result.auto_renew).toBe(true);
  });

  it("should reject contract with invalid dates", () => {
    const invalid = {
      opportunity_id: "123e4567-e89b-12d3-a456-426614174000",
      start_date: new Date("2025-06-01"),
      end_date: new Date("2025-06-15"), // Less than 30 days
      total_value: 60000,
      billing_cycle: "monthly",
      auto_renew: false,
    };

    expect(() => ContractCreateSchema.parse(invalid)).toThrow();
  });

  it("should reject end_date before start_date", () => {
    const invalid = {
      opportunity_id: "123e4567-e89b-12d3-a456-426614174000",
      start_date: new Date("2025-06-01"),
      end_date: new Date("2025-01-01"), // Before start
      total_value: 60000,
      billing_cycle: "monthly",
      auto_renew: false,
    };

    expect(() => ContractCreateSchema.parse(invalid)).toThrow();
  });

  it("should reject total_value below minimum", () => {
    const invalid = {
      opportunity_id: "123e4567-e89b-12d3-a456-426614174000",
      start_date: new Date("2025-01-01"),
      end_date: new Date("2026-01-01"),
      total_value: 50, // Below min 100
      billing_cycle: "monthly",
      auto_renew: false,
    };

    expect(() => ContractCreateSchema.parse(invalid)).toThrow();
  });
});

describe("ContractUpdateSchema", () => {
  it("should validate partial contract updates", () => {
    const update = {
      total_value: 70000,
      auto_renew: false,
    };

    const result = ContractUpdateSchema.parse(update);
    expect(result.total_value).toBe(70000);
  });

  it("should reject invalid partial updates", () => {
    const invalid = {
      billing_cycle: "invalid_cycle",
    };

    expect(() => ContractUpdateSchema.parse(invalid)).toThrow();
  });
});

describe("ContractQuerySchema", () => {
  it("should validate contract query params", () => {
    const query = {
      page: "1",
      status: "active",
      billing_cycle: "monthly",
      auto_renew: "true",
    };

    const result = ContractQuerySchema.parse(query);

    expect(result.status).toBe("active");
    expect(result.auto_renew).toBe(true); // Coerced to boolean
  });

  it("should apply defaults and validate renewal_date_within_days", () => {
    const query = {
      renewal_date_within_days: "30",
    };

    const result = ContractQuerySchema.parse(query);

    expect(result.page).toBe(1);
    expect(result.renewal_date_within_days).toBe(30);
  });
});
