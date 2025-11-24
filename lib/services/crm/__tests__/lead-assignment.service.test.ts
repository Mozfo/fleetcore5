import { describe, it, expect, beforeEach, vi } from "vitest";
import { LeadAssignmentService } from "../lead-assignment.service";
import type {
  EligibleEmployee,
  LeadAssignmentInput,
} from "../lead-assignment.service";

// Mock CrmSettingsRepository to return lead_assignment_rules
vi.mock("@/lib/repositories/crm/settings.repository", () => ({
  CrmSettingsRepository: vi.fn().mockImplementation(() => ({
    getSettingValue: vi.fn().mockResolvedValue({
      fleet_size_priority: {
        "500+": {
          title_patterns: ["%Senior%Account%Manager%"],
          priority: 1,
        },
        "101-500": {
          title_patterns: ["%Account%Manager%"],
          exclude_patterns: ["%Senior%"],
          priority: 2,
        },
      },
      geographic_zones: {
        UAE: {
          countries: ["AE"],
          title_patterns: ["%UAE%", "%Emirates%"],
          priority: 10,
        },
        KSA: {
          countries: ["SA"],
          title_patterns: ["%KSA%", "%Saudi%"],
          priority: 11,
        },
        FRANCE: {
          countries: ["FR"],
          title_patterns: ["%France%"],
          priority: 12,
        },
        MENA: {
          countries: [
            "KW",
            "BH",
            "OM",
            "QA",
            "JO",
            "LB",
            "EG",
            "MA",
            "TN",
            "DZ",
          ],
          title_patterns: ["%MENA%", "%Middle East%"],
          priority: 13,
        },
        EU: {
          countries: [
            "DE",
            "IT",
            "ES",
            "BE",
            "NL",
            "PT",
            "AT",
            "IE",
            "DK",
            "SE",
            "FI",
            "GR",
            "PL",
            "CZ",
            "HU",
            "RO",
            "BG",
            "HR",
            "SI",
            "SK",
            "LT",
            "LV",
            "EE",
            "CY",
            "LU",
            "MT",
          ],
          title_patterns: ["%EU%", "%Europe%"],
          priority: 14,
        },
        INTERNATIONAL: {
          countries: [],
          title_patterns: ["%International%"],
          priority: 15,
        },
      },
      fallback: {
        employee_id: null,
        title_pattern: "%Sales%Manager%",
      },
    }),
  })),
  CrmSettingKey: {
    LEAD_SCORING_CONFIG: "lead_scoring_config",
    LEAD_ASSIGNMENT_RULES: "lead_assignment_rules",
  },
}));

describe("LeadAssignmentService", () => {
  let service: LeadAssignmentService;

  // Sample employees for testing
  const seniorAccountManager: EligibleEmployee = {
    id: "emp-senior-001",
    first_name: "Alice",
    last_name: "Johnson",
    email: "alice@fleetcore.com",
    title: "Senior Account Manager",
    status: "active",
  };

  const accountManager: EligibleEmployee = {
    id: "emp-account-002",
    first_name: "Bob",
    last_name: "Smith",
    email: "bob@fleetcore.com",
    title: "Account Manager",
    status: "active",
  };

  const uaeSpecialist: EligibleEmployee = {
    id: "emp-uae-003",
    first_name: "Fatima",
    last_name: "Al Mansouri",
    email: "fatima@fleetcore.com",
    title: "UAE Sales Specialist",
    status: "active",
  };

  const ksaSpecialist: EligibleEmployee = {
    id: "emp-ksa-004",
    first_name: "Mohammed",
    last_name: "Al Zahrani",
    email: "mohammed@fleetcore.com",
    title: "KSA Regional Manager",
    status: "active",
  };

  const franceSpecialist: EligibleEmployee = {
    id: "emp-france-005",
    first_name: "Pierre",
    last_name: "Dubois",
    email: "pierre@fleetcore.com",
    title: "France Sales Manager",
    status: "active",
  };

  const salesManager: EligibleEmployee = {
    id: "emp-sales-006",
    first_name: "Carlos",
    last_name: "Rodriguez",
    email: "carlos@fleetcore.com",
    title: "Sales Manager",
    status: "active",
  };

  const generalRep: EligibleEmployee = {
    id: "emp-general-007",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@fleetcore.com",
    title: "Sales Representative",
    status: "active",
  };

  beforeEach(() => {
    service = new LeadAssignmentService();
  });

  // ===== TEST SUITE 1: Fleet Size Priority (3 tests) =====

  describe("Fleet Size Priority", () => {
    it("should assign 500+ fleet to Senior Account Manager", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: "500+",
        country_code: "US",
      };

      const employees = [accountManager, seniorAccountManager, generalRep];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(seniorAccountManager.id);
      expect(result.assignment_reason).toContain("Fleet size priority");
      expect(result.assignment_reason).toContain("500+");
      expect(result.matched_rule).toBe("500+");
      expect(result.eligible_employees).toBe(1); // Only senior AM matched
    });

    it("should assign 101-500 fleet to Account Manager (exclude Senior)", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: "101-500",
        country_code: "US",
      };

      const employees = [seniorAccountManager, accountManager, generalRep];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(accountManager.id);
      expect(result.assignment_reason).toContain("Fleet size priority");
      expect(result.assignment_reason).toContain("101-500");
      expect(result.matched_rule).toBe("101-500");
      expect(result.eligible_employees).toBe(1); // Exclude Senior AM
    });

    it("should skip fleet size rule if no matching title found", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: "500+",
        country_code: "US",
      };

      // No Senior Account Manager available
      const employees = [accountManager, generalRep];

      const result = await service.assignToSalesRep(lead, employees);

      // Should fall through to ultimate fallback
      expect(result.assigned_to).toBe(accountManager.id); // First by ID sort
      expect(result.matched_rule).toBe("ultimate_fallback");
    });
  });

  // ===== TEST SUITE 2: Geographic Zones (4 tests) =====

  describe("Geographic Zones", () => {
    it("should assign UAE lead to UAE specialist", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: "11-50", // No fleet size rule for this
        country_code: "AE",
      };

      const employees = [accountManager, uaeSpecialist, salesManager];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(uaeSpecialist.id);
      expect(result.assignment_reason).toContain("Geographic zone");
      expect(result.assignment_reason).toContain("UAE");
      expect(result.matched_rule).toBe("UAE");
      expect(result.eligible_employees).toBe(1);
    });

    it("should assign KSA lead to KSA specialist", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: null,
        country_code: "SA",
      };

      const employees = [ksaSpecialist, salesManager];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(ksaSpecialist.id);
      expect(result.assignment_reason).toContain("Geographic zone");
      expect(result.assignment_reason).toContain("KSA");
      expect(result.matched_rule).toBe("KSA");
    });

    it("should assign France lead to France specialist", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: null,
        country_code: "FR",
      };

      const employees = [franceSpecialist, salesManager, generalRep];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(franceSpecialist.id);
      expect(result.assignment_reason).toContain("Geographic zone");
      expect(result.assignment_reason).toContain("FRANCE");
      expect(result.matched_rule).toBe("FRANCE");
    });

    it("should handle lowercase country codes correctly", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: null,
        country_code: "ae", // Lowercase
      };

      const employees = [uaeSpecialist, salesManager];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(uaeSpecialist.id);
      expect(result.matched_rule).toBe("UAE");
    });
  });

  // ===== TEST SUITE 3: Fallback Logic (3 tests) =====

  describe("Fallback Logic", () => {
    it("should assign to Sales Manager when no rules match", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: null,
        country_code: "BR", // No geographic rule for Brazil
      };

      const employees = [generalRep, salesManager, accountManager];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(salesManager.id);
      expect(result.assignment_reason).toContain("Fallback");
      expect(result.matched_rule).toBe("fallback_pattern");
      expect(result.eligible_employees).toBe(1);
    });

    it("should use ultimate fallback when no Sales Manager available", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: null,
        country_code: "BR",
      };

      // No Sales Manager
      const employees = [accountManager, generalRep];

      const result = await service.assignToSalesRep(lead, employees);

      expect(result.assigned_to).toBe(accountManager.id); // First by ID sort
      expect(result.assignment_reason).toContain("Ultimate fallback");
      expect(result.matched_rule).toBe("ultimate_fallback");
      expect(result.eligible_employees).toBe(2);
    });

    it("should prioritize fleet size over geographic zone", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: "500+",
        country_code: "AE", // Both rules match
      };

      const employees = [seniorAccountManager, uaeSpecialist, salesManager];

      const result = await service.assignToSalesRep(lead, employees);

      // Fleet size priority should win
      expect(result.assigned_to).toBe(seniorAccountManager.id);
      expect(result.matched_rule).toBe("500+");
    });
  });

  // ===== TEST SUITE 4: Edge Cases (2 tests) =====

  describe("Edge Cases", () => {
    it("should return null when no employees available", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: "500+",
        country_code: "AE",
      };

      const result = await service.assignToSalesRep(lead, []);

      expect(result.assigned_to).toBeNull();
      expect(result.assignment_reason).toContain(
        "No active employees available"
      );
      expect(result.matched_rule).toBeUndefined();
      expect(result.eligible_employees).toBeUndefined();
    });

    it("should handle round-robin selection deterministically", async () => {
      const lead: LeadAssignmentInput = {
        fleet_size: null,
        country_code: null,
      };

      // Sales Manager will match fallback pattern, then select first by ID
      const employees = [
        { ...generalRep, id: "emp-zzz", title: "Sales Representative" },
        { ...accountManager, id: "emp-aaa", title: "Account Manager" },
        { ...salesManager, id: "emp-mmm", title: "Sales Manager" },
      ];

      const result = await service.assignToSalesRep(lead, employees);

      // Sales Manager matches fallback pattern, so emp-mmm is selected
      expect(result.assigned_to).toBe("emp-mmm");
      expect(result.matched_rule).toBe("fallback_pattern");
    });
  });
});
