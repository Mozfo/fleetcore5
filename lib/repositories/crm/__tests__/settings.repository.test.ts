import { describe, it, expect, beforeEach, vi } from "vitest";
import { CrmSettingsRepository } from "../settings.repository";
import type { PrismaClient } from "@prisma/client";

describe("CrmSettingsRepository", () => {
  let repository: CrmSettingsRepository;
  let mockPrisma: {
    crm_settings: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      crm_settings: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    };

    repository = new CrmSettingsRepository(
      mockPrisma as unknown as PrismaClient
    );
  });

  describe("getSetting", () => {
    it("should get setting by key", async () => {
      mockPrisma.crm_settings.findFirst.mockResolvedValue({
        id: "setting-1",
        setting_key: "lead_scoring_config",
        setting_value: { test: "value" },
        category: "scoring",
        data_type: "object",
        is_active: true,
        is_system: true,
        version: 1,
        schema_version: null,
        display_label: "Lead Scoring Algorithm",
        display_order: 1,
        ui_component: "nested_form",
        help_text: "Configure scoring...",
        documentation_url: "https://docs.fleetcore.com/scoring",
        default_value: null,
        description: "Test setting",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
      });

      const result = await repository.getSetting("lead_scoring_config");

      expect(result).toBeDefined();
      expect(result?.setting_key).toBe("lead_scoring_config");
      expect(mockPrisma.crm_settings.findFirst).toHaveBeenCalledWith({
        where: {
          setting_key: "lead_scoring_config",
          is_active: true,
          deleted_at: null,
        },
      });
    });

    it("should return null if setting not found", async () => {
      mockPrisma.crm_settings.findFirst.mockResolvedValue(null);

      const result = await repository.getSetting("nonexistent_key");

      expect(result).toBeNull();
    });

    it("should exclude inactive settings", async () => {
      mockPrisma.crm_settings.findFirst.mockResolvedValue(null);

      await repository.getSetting("inactive_setting");

      expect(mockPrisma.crm_settings.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          is_active: true,
        }),
      });
    });

    it("should exclude soft-deleted settings", async () => {
      mockPrisma.crm_settings.findFirst.mockResolvedValue(null);

      await repository.getSetting("deleted_setting");

      expect(mockPrisma.crm_settings.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deleted_at: null,
        }),
      });
    });
  });

  describe("getSettingValue", () => {
    it("should get setting value typed", async () => {
      const mockValue = { fleet_size_points: { "500+": 40 } };
      mockPrisma.crm_settings.findFirst.mockResolvedValue({
        id: "setting-1",
        setting_key: "lead_scoring_config",
        setting_value: mockValue,
        category: "scoring",
        data_type: "object",
        is_active: true,
        is_system: true,
        version: 1,
        schema_version: null,
        display_label: null,
        display_order: 0,
        ui_component: null,
        help_text: null,
        documentation_url: null,
        default_value: null,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
      });

      const result = await repository.getSettingValue("lead_scoring_config");

      expect(result).toEqual(mockValue);
    });

    it("should return null if setting not found", async () => {
      mockPrisma.crm_settings.findFirst.mockResolvedValue(null);

      const result = await repository.getSettingValue("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getSettingsByCategory", () => {
    it("should get settings by category", async () => {
      mockPrisma.crm_settings.findMany.mockResolvedValue([
        {
          id: "setting-1",
          setting_key: "lead_scoring_config",
          setting_value: {},
          category: "scoring",
          data_type: "object",
          is_active: true,
          is_system: true,
          version: 1,
          schema_version: null,
          display_label: null,
          display_order: 0,
          ui_component: null,
          help_text: null,
          documentation_url: null,
          default_value: null,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
        },
        {
          id: "setting-2",
          setting_key: "opportunity_scoring_config",
          setting_value: {},
          category: "scoring",
          data_type: "object",
          is_active: true,
          is_system: true,
          version: 1,
          schema_version: null,
          display_label: null,
          display_order: 0,
          ui_component: null,
          help_text: null,
          documentation_url: null,
          default_value: null,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
        },
      ]);

      const result = await repository.getSettingsByCategory("scoring");

      expect(result).toHaveLength(2);
      expect(mockPrisma.crm_settings.findMany).toHaveBeenCalledWith({
        where: {
          category: "scoring",
          is_active: true,
          deleted_at: null,
        },
        orderBy: {
          setting_key: "asc",
        },
      });
    });
  });

  describe("getAllSettings", () => {
    it("should get all active settings", async () => {
      mockPrisma.crm_settings.findMany.mockResolvedValue([
        {
          id: "setting-1",
          setting_key: "key1",
          setting_value: {},
          category: "scoring",
          data_type: "object",
          is_active: true,
          is_system: true,
          version: 1,
          schema_version: null,
          display_label: null,
          display_order: 0,
          ui_component: null,
          help_text: null,
          documentation_url: null,
          default_value: null,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
        },
        {
          id: "setting-2",
          setting_key: "key2",
          setting_value: {},
          category: "assignment",
          data_type: "object",
          is_active: true,
          is_system: true,
          version: 1,
          schema_version: null,
          display_label: null,
          display_order: 0,
          ui_component: null,
          help_text: null,
          documentation_url: null,
          default_value: null,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
        },
      ]);

      const result = await repository.getAllSettings();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(mockPrisma.crm_settings.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          deleted_at: null,
        },
        orderBy: [{ category: "asc" }, { setting_key: "asc" }],
      });
    });
  });

  describe("exists", () => {
    it("should return true if setting exists", async () => {
      mockPrisma.crm_settings.count.mockResolvedValue(1);

      const result = await repository.exists("lead_scoring_config");

      expect(result).toBe(true);
    });

    it("should return false if setting does not exist", async () => {
      mockPrisma.crm_settings.count.mockResolvedValue(0);

      const result = await repository.exists("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("getSettingMetadata", () => {
    it("should get setting metadata without value", async () => {
      mockPrisma.crm_settings.findFirst.mockResolvedValue({
        setting_key: "lead_scoring_config",
        display_label: "Lead Scoring Algorithm",
        display_order: 1,
        ui_component: "nested_form",
        help_text: "Configure scoring...",
        documentation_url: "https://docs.fleetcore.com/scoring",
        category: "scoring",
        data_type: "object",
        is_system: true,
      });

      const result = await repository.getSettingMetadata("lead_scoring_config");

      expect(result).toBeDefined();
      expect(result?.display_label).toBe("Lead Scoring Algorithm");
      expect(result?.display_order).toBe(1);
      expect(result?.ui_component).toBe("nested_form");
      expect(mockPrisma.crm_settings.findFirst).toHaveBeenCalledWith({
        where: {
          setting_key: "lead_scoring_config",
          is_active: true,
          deleted_at: null,
        },
        select: {
          setting_key: true,
          display_label: true,
          display_order: true,
          ui_component: true,
          help_text: true,
          documentation_url: true,
          category: true,
          data_type: true,
          is_system: true,
        },
      });
    });
  });

  describe("getAllSettingsMetadata", () => {
    it("should get all settings metadata grouped by category", async () => {
      mockPrisma.crm_settings.findMany.mockResolvedValue([
        {
          setting_key: "lead_scoring_config",
          display_label: "Lead Scoring Algorithm",
          display_order: 1,
          category: "scoring",
          ui_component: "nested_form",
          help_text: "Help text",
          documentation_url: "https://docs",
          is_system: true,
        },
        {
          setting_key: "lead_assignment_rules",
          display_label: "Lead Assignment Rules",
          display_order: 2,
          category: "assignment",
          ui_component: "nested_form",
          help_text: "Help text",
          documentation_url: "https://docs",
          is_system: true,
        },
      ]);

      const result = await repository.getAllSettingsMetadata();

      expect(result.size).toBe(2);
      expect(result.has("scoring")).toBe(true);
      expect(result.has("assignment")).toBe(true);
      expect(result.get("scoring")?.[0].display_label).toBe(
        "Lead Scoring Algorithm"
      );
      expect(mockPrisma.crm_settings.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          deleted_at: null,
        },
        select: {
          setting_key: true,
          display_label: true,
          display_order: true,
          ui_component: true,
          help_text: true,
          documentation_url: true,
          category: true,
          is_system: true,
        },
        orderBy: [{ category: "asc" }, { display_order: "asc" }],
      });
    });
  });
});
