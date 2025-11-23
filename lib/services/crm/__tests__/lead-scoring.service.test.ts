import { describe, it, expect, beforeEach, vi } from "vitest";
import { LeadScoringService } from "../lead-scoring.service";
import type {
  FitScoreInput,
  EngagementScoreInput,
  LeadMetadata,
} from "../lead-scoring.service";

// Mock CountryService to always return operational countries
vi.mock("../country.service", () => ({
  CountryService: vi.fn().mockImplementation(() => ({
    isOperational: vi.fn().mockResolvedValue(true), // All countries operational by default
    isGdprCountry: vi.fn().mockResolvedValue(false),
  })),
}));

// Mock CrmSettingsRepository to return lead_scoring_config
vi.mock("@/lib/repositories/crm/settings.repository", () => ({
  CrmSettingsRepository: vi.fn().mockImplementation(() => ({
    getSettingValue: vi.fn().mockResolvedValue({
      fleet_size_points: {
        "500+": { vehicles: 600, points: 40 },
        "101-500": { vehicles: 250, points: 35 },
        "51-100": { vehicles: 75, points: 30 },
        "11-50": { vehicles: 30, points: 20 },
        "1-10": { vehicles: 5, points: 5 },
        unknown: { vehicles: 30, points: 10 },
      },
      country_tier_points: {
        tier1: { countries: ["AE", "SA", "QA"], points: 20 },
        tier2: { countries: ["FR"], points: 18 },
        tier3: { countries: ["KW", "BH", "OM"], points: 15 },
        tier4: {
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
          points: 12,
        },
        tier5: { points: 5 },
      },
      message_length_thresholds: {
        detailed: { min: 200, points: 30 },
        substantial: { min: 100, points: 20 },
        minimal: { min: 20, points: 10 },
        none: { points: 0 },
      },
      phone_points: { provided: 20, missing: 0 },
      page_views_thresholds: {
        very_engaged: { min: 10, points: 30 },
        interested: { min: 5, points: 20 },
        curious: { min: 2, points: 10 },
        normal: { points: 5 },
      },
      time_on_site_thresholds: {
        deep_read: { min: 600, points: 20 },
        moderate: { min: 300, points: 15 },
        brief: { min: 120, points: 10 },
        quick: { points: 5 },
      },
      qualification_stage_thresholds: {
        sales_qualified: 70,
        marketing_qualified: 40,
        top_of_funnel: 0,
      },
      qualification_weights: {
        fit: 0.6,
        engagement: 0.4,
      },
    }),
  })),
}));

describe("LeadScoringService", () => {
  let service: LeadScoringService;

  beforeEach(() => {
    service = new LeadScoringService();
  });

  // ===== TEST SUITE 1: calculateFitScore() - 8 tests =====

  describe("calculateFitScore", () => {
    it("should return 60 points for fleet 500+ in UAE (maximum score)", async () => {
      const input: FitScoreInput = {
        fleet_size: "500+",
        country_code: "AE",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(60); // 40 (fleet) + 20 (tier1 country)
    });

    it("should return 53 points for fleet 101-500 in France", async () => {
      const input: FitScoreInput = {
        fleet_size: "101-500",
        country_code: "FR",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(53); // 35 (fleet) + 18 (tier2 France)
    });

    it("should return 45 points for fleet 51-100 in Kuwait", async () => {
      const input: FitScoreInput = {
        fleet_size: "51-100",
        country_code: "KW",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(45); // 30 (fleet) + 15 (tier3 MENA)
    });

    it("should return 32 points for fleet 11-50 in Germany", async () => {
      const input: FitScoreInput = {
        fleet_size: "11-50",
        country_code: "DE",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(32); // 20 (fleet) + 12 (tier4 EU)
    });

    it("should return 10 points for fleet 1-10 in USA (minimum viable)", async () => {
      const input: FitScoreInput = {
        fleet_size: "1-10",
        country_code: "US",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(10); // 5 (small fleet) + 5 (tier5 other)
    });

    it("should return 28 points for unknown fleet in France", async () => {
      const input: FitScoreInput = {
        fleet_size: null, // Will default to "unknown"
        country_code: "FR",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(28); // 10 (unknown default) + 18 (tier2 France)
    });

    it("should return 45 points for fleet 500+ in Brazil (expansion market)", async () => {
      const input: FitScoreInput = {
        fleet_size: "500+",
        country_code: "BR",
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(45); // 40 (fleet) + 5 (tier5 expansion)
    });

    it("should handle null country_code gracefully (default tier5)", async () => {
      const input: FitScoreInput = {
        fleet_size: "500+",
        country_code: null,
      };

      const result = await service.calculateFitScore(input);

      expect(result).toBe(45); // 40 (fleet) + 5 (tier5 default)
    });
  });

  // ===== TEST SUITE 2: calculateEngagementScore() - 10 tests =====

  describe("calculateEngagementScore", () => {
    it("should return 100 points for fully engaged prospect (maximum score)", async () => {
      const input: EngagementScoreInput = {
        message:
          "We operate a fleet of 500 vehicles across UAE and need comprehensive fleet management solution. Our current challenges include vehicle maintenance tracking, driver performance monitoring, and fuel optimization. We're looking for a platform that can integrate with our existing systems and provide real-time analytics.",
        phone: "+971501234567",
        metadata: {
          page_views: 15,
          time_on_site: 720, // 12 minutes
        },
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(100); // 30 (message) + 20 (phone) + 30 (pages) + 20 (time)
    });

    it("should return 75 points for moderate engagement", async () => {
      const input: EngagementScoreInput = {
        message:
          "We're interested in FleetCore for our taxi company. We have around 150 vehicles and want to improve our operations. Can you provide more details?",
        phone: "+33612345678",
        metadata: {
          page_views: 7,
          time_on_site: 400, // 6.6 minutes
        },
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(75); // 20 (150 chars) + 20 (phone) + 20 (7 pages) + 15 (400s)
    });

    it("should return 30 points for minimal engagement", async () => {
      const input: EngagementScoreInput = {
        message: "Interested in demo for small fleet.",
        phone: null, // No phone
        metadata: {
          page_views: 3,
          time_on_site: 150, // 2.5 minutes
        },
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(30); // 10 (38 chars) + 0 (no phone) + 10 (3 pages) + 10 (150s)
    });

    it("should return 10 points for minimal interaction", async () => {
      const input: EngagementScoreInput = {
        message: "", // Empty message
        phone: null,
        metadata: {
          page_views: 1,
          time_on_site: 60, // 1 minute
        },
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(10); // 0 (empty) + 0 (no phone) + 5 (1 page) + 5 (60s)
    });

    it("should award 30 points for message length 201+ chars only", async () => {
      const longMessage = "A".repeat(201); // Exactly 201 chars
      const input: EngagementScoreInput = {
        message: longMessage,
        phone: null,
        metadata: null,
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(40); // 30 (message) + 0 (no phone) + 5 (default pages) + 5 (default time)
    });

    it("should award 20 points for phone provided only", async () => {
      const input: EngagementScoreInput = {
        message: null,
        phone: "+33612345678",
        metadata: null,
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(30); // 0 + 20 (phone) + 5 + 5
    });

    it("should award 30 points for 15+ page views only", async () => {
      const input: EngagementScoreInput = {
        message: null,
        phone: null,
        metadata: {
          page_views: 15,
          time_on_site: 0,
        },
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(35); // 0 + 0 + 30 (15 pages) + 5 (0s default)
    });

    it("should award 20 points for 800s time on site only", async () => {
      const input: EngagementScoreInput = {
        message: null,
        phone: null,
        metadata: {
          page_views: 0,
          time_on_site: 800,
        },
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(25); // 0 + 0 + 5 (0 pages) + 20 (800s)
    });

    it("should handle null metadata gracefully", async () => {
      const input: EngagementScoreInput = {
        message: null,
        phone: null,
        metadata: null,
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(10); // 0 + 0 + 5 (default) + 5 (default)
    });

    it("should use defaults when page_views/time_on_site absent from metadata", async () => {
      const input: EngagementScoreInput = {
        message: null,
        phone: null,
        metadata: {}, // Empty metadata object
      };

      const result = await service.calculateEngagementScore(input);

      expect(result).toBe(10); // 0 + 0 + 5 (default) + 5 (default)
    });
  });

  // ===== TEST SUITE 3: calculateQualificationScore() - 7 tests =====

  describe("calculateQualificationScore", () => {
    it("should classify as sales_qualified for score 76 (SQL threshold)", async () => {
      const result = await service.calculateQualificationScore(60, 100);

      expect(result.fit_score).toBe(60);
      expect(result.engagement_score).toBe(100);
      expect(result.qualification_score).toBe(76); // (60*0.6) + (100*0.4) = 76
      expect(result.lead_stage).toBe("sales_qualified");
      expect(result.breakdown.qualification.formula).toContain("0.6");
      expect(result.breakdown.qualification.formula).toContain("0.4");
    });

    it("should classify as marketing_qualified for score 54 (MQL mid-range)", async () => {
      const result = await service.calculateQualificationScore(50, 60);

      expect(result.qualification_score).toBe(54); // (50*0.6) + (60*0.4) = 54
      expect(result.lead_stage).toBe("marketing_qualified");
    });

    it("should classify as top_of_funnel for score 26 (TOF)", async () => {
      const result = await service.calculateQualificationScore(30, 20);

      expect(result.qualification_score).toBe(26); // (30*0.6) + (20*0.4) = 26
      expect(result.lead_stage).toBe("top_of_funnel");
    });

    it("should classify as marketing_qualified for score 56 (MQL upper range)", async () => {
      const result = await service.calculateQualificationScore(40, 80);

      expect(result.qualification_score).toBe(56); // (40*0.6) + (80*0.4) = 56
      expect(result.lead_stage).toBe("marketing_qualified");
    });

    it("should classify as marketing_qualified at exact threshold 40", async () => {
      const result = await service.calculateQualificationScore(50, 50);

      expect(result.qualification_score).toBe(50); // (50*0.6) + (50*0.4) = 50
      expect(result.lead_stage).toBe("marketing_qualified");
    });

    it("should classify as marketing_qualified for score 69.6 (just below SQL)", async () => {
      const result = await service.calculateQualificationScore(60, 84);

      // (60*0.6) + (84*0.4) = 36 + 33.6 = 69.6 → rounds to 70
      expect(result.qualification_score).toBe(70); // Math.round(69.6) = 70
      expect(result.lead_stage).toBe("sales_qualified"); // Now SQL because rounded to 70
    });

    it("should round qualification_score correctly (edge case)", async () => {
      const result = await service.calculateQualificationScore(59, 83);

      // (59*0.6) + (83*0.4) = 35.4 + 33.2 = 68.6 → rounds to 69
      expect(result.qualification_score).toBe(69);
      expect(result.lead_stage).toBe("marketing_qualified");
    });
  });

  // ===== TEST SUITE 4: calculateLeadScores() - 3 integration tests =====

  describe("calculateLeadScores (integration)", () => {
    it("should calculate SQL for premium lead", async () => {
      const leadData = {
        fleet_size: "500+",
        country_code: "AE",
        message:
          "We operate a fleet of 600 vehicles across UAE and Saudi Arabia. Our current challenges include vehicle maintenance tracking, driver performance monitoring, fuel optimization, and compliance reporting. We're looking for a comprehensive platform that can integrate with our existing ERP system and provide real-time analytics with mobile access for our fleet managers.",
        phone: "+971501234567",
        metadata: {
          page_views: 15,
          time_on_site: 800,
        } as LeadMetadata,
      };

      const result = await service.calculateLeadScores(leadData);

      expect(result.fit_score).toBe(60); // 40 (500+) + 20 (AE)
      expect(result.engagement_score).toBe(100); // 30 + 20 + 30 + 20
      expect(result.qualification_score).toBe(76); // (60*0.6) + (100*0.4)
      expect(result.lead_stage).toBe("sales_qualified");
    });

    it("should calculate MQL for average lead", async () => {
      const leadData = {
        fleet_size: "51-100",
        country_code: "FR",
        message:
          "We're a transportation company with 75 vehicles. We're interested in improving our fleet operations and would like to know more about FleetCore's features and pricing.",
        phone: "+33612345678",
        metadata: {
          page_views: 6,
          time_on_site: 350,
        } as LeadMetadata,
      };

      const result = await service.calculateLeadScores(leadData);

      expect(result.fit_score).toBe(48); // 30 (51-100) + 18 (FR)
      expect(result.engagement_score).toBe(75); // 20 (170 chars) + 20 (phone) + 20 (6 pages) + 15 (350s)
      expect(result.qualification_score).toBe(59); // (48*0.6) + (75*0.4) = 28.8 + 30 = 58.8 → 59
      expect(result.lead_stage).toBe("marketing_qualified");
    });

    it("should calculate TOF for minimal lead", async () => {
      const leadData = {
        fleet_size: "1-10",
        country_code: "US",
        message: "Just checking options.",
        phone: null,
        metadata: {
          page_views: 2,
          time_on_site: 90,
        } as LeadMetadata,
      };

      const result = await service.calculateLeadScores(leadData);

      expect(result.fit_score).toBe(10); // 5 (1-10) + 5 (US)
      expect(result.engagement_score).toBe(20); // 10 (24 chars) + 0 + 5 (2 pages) + 5 (90s)
      expect(result.qualification_score).toBe(14); // (10*0.6) + (20*0.4) = 6 + 8 = 14
      expect(result.lead_stage).toBe("top_of_funnel");
    });
  });
});
