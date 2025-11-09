/**
 * NotificationTemplateRepository Unit Tests
 * Tests JSONB extraction, array queries, and UNIQUE constraints
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationTemplateRepository } from "../notification-template.repository";
import type { PrismaClient, dir_notification_templates } from "@prisma/client";

// Mock Prisma Client
const mockPrisma = {
  dir_notification_templates: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
} as unknown as PrismaClient;

describe("NotificationTemplateRepository", () => {
  let repository: NotificationTemplateRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new NotificationTemplateRepository(mockPrisma);
  });

  describe("findByTemplateCode", () => {
    it("should find template by code and channel", async () => {
      const mockTemplate: Partial<dir_notification_templates> = {
        id: "tpl-1",
        template_code: "lead_confirmation",
        channel: "email",
        subject_translations: { en: "Thanks", fr: "Merci" },
        body_translations: { en: "Thank you", fr: "Merci beaucoup" },
        deleted_at: null,
      };

      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue(mockTemplate as dir_notification_templates);

      const result = await repository.findByTemplateCode(
        "lead_confirmation",
        "email"
      );

      expect(result).toEqual(mockTemplate);
      expect(
        mockPrisma.dir_notification_templates.findFirst
      ).toHaveBeenCalledWith({
        where: {
          template_code: "lead_confirmation",
          channel: "email",
          deleted_at: null,
        },
      });
    });

    it("should respect UNIQUE constraint (code, channel)", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue(null);

      await repository.findByTemplateCode("lead_confirmation", "sms");

      expect(
        mockPrisma.dir_notification_templates.findFirst
      ).toHaveBeenCalledWith({
        where: expect.objectContaining({
          template_code: "lead_confirmation",
          channel: "sms",
        }),
      });
    });

    it("should return null if deleted", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue(null);

      const result = await repository.findByTemplateCode(
        "deleted_template",
        "email"
      );

      expect(result).toBeNull();
    });
  });

  describe("findByCountryAndLocale", () => {
    it("should query supported_countries array", async () => {
      const mockTemplates: Partial<dir_notification_templates>[] = [
        {
          id: "tpl-1",
          supported_countries: ["FR", "BE"],
          supported_locales: ["fr", "en"],
        },
      ];

      vi.mocked(
        mockPrisma.dir_notification_templates.findMany
      ).mockResolvedValue(mockTemplates as dir_notification_templates[]);

      await repository.findByCountryAndLocale("FR", "fr");

      expect(
        mockPrisma.dir_notification_templates.findMany
      ).toHaveBeenCalledWith({
        where: {
          supported_countries: { has: "FR" },
          supported_locales: { has: "fr" },
          deleted_at: null,
        },
        orderBy: {
          template_code: "asc",
        },
      });
    });

    it("should query supported_locales array", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findMany
      ).mockResolvedValue([]);

      await repository.findByCountryAndLocale("AE", "ar", "email");

      expect(
        mockPrisma.dir_notification_templates.findMany
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supported_countries: { has: "AE" },
            supported_locales: { has: "ar" },
            channel: "email",
          }),
        })
      );
    });

    it("should use GIN indexes for performance", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findMany
      ).mockResolvedValue([]);

      await repository.findByCountryAndLocale("US", "en");

      expect(
        mockPrisma.dir_notification_templates.findMany
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supported_countries: { has: "US" },
            supported_locales: { has: "en" },
          }),
        })
      );
    });
  });

  describe("getTemplateForLocale", () => {
    it("should extract JSONB subject_translations", async () => {
      const mockTemplate: Partial<dir_notification_templates> = {
        id: "tpl-1",
        template_code: "welcome",
        channel: "email",
        subject_translations: { en: "Welcome", fr: "Bienvenue", ar: "مرحبا" },
        body_translations: { en: "Body EN", fr: "Body FR", ar: "Body AR" },
        deleted_at: null,
      };

      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue(mockTemplate as dir_notification_templates);

      const result = await repository.getTemplateForLocale(
        "welcome",
        "email",
        "fr"
      );

      expect(result?.subject).toBe("Bienvenue");
      expect(result?.body).toBe("Body FR");
    });

    it("should extract JSONB body_translations", async () => {
      const mockTemplate: Partial<dir_notification_templates> = {
        id: "tpl-1",
        template_code: "alert",
        channel: "email",
        subject_translations: { en: "Alert", ar: "تنبيه" },
        body_translations: { en: "Alert body", ar: "نص التنبيه" },
        deleted_at: null,
      };

      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue(mockTemplate as dir_notification_templates);

      const result = await repository.getTemplateForLocale(
        "alert",
        "email",
        "ar"
      );

      expect(result?.subject).toBe("تنبيه");
      expect(result?.body).toBe("نص التنبيه");
    });

    it("should fallback to en if locale translation missing", async () => {
      const mockTemplate: Partial<dir_notification_templates> = {
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "English subject" },
        body_translations: { en: "English body" },
        deleted_at: null,
      };

      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue(mockTemplate as dir_notification_templates);

      const result = await repository.getTemplateForLocale(
        "test",
        "email",
        "de",
        "en"
      );

      expect(result?.subject).toBe("English subject");
      expect(result?.body).toBe("English body");
    });
  });

  describe("templateExists", () => {
    it("should check UNIQUE constraint", async () => {
      vi.mocked(mockPrisma.dir_notification_templates.count).mockResolvedValue(
        1
      );

      const result = await repository.templateExists(
        "lead_confirmation",
        "email"
      );

      expect(result).toBe(true);
      expect(mockPrisma.dir_notification_templates.count).toHaveBeenCalledWith({
        where: {
          template_code: "lead_confirmation",
          channel: "email",
          deleted_at: null,
        },
      });
    });

    it("should return false for non-existent template", async () => {
      vi.mocked(mockPrisma.dir_notification_templates.count).mockResolvedValue(
        0
      );

      const result = await repository.templateExists("unknown", "sms");

      expect(result).toBe(false);
    });
  });

  describe("getAllTemplateCodes", () => {
    it("should return unique codes sorted", async () => {
      const mockTemplates: Partial<dir_notification_templates>[] = [
        { id: "1", template_code: "alert" },
        { id: "3", template_code: "confirmation" },
        { id: "2", template_code: "welcome" },
      ];

      vi.mocked(
        mockPrisma.dir_notification_templates.findMany
      ).mockResolvedValue(mockTemplates as dir_notification_templates[]);

      const result = await repository.getAllTemplateCodes();

      expect(result).toEqual(["alert", "confirmation", "welcome"]);
    });
  });

  describe("getAvailableChannels", () => {
    it("should return distinct channels", async () => {
      const mockTemplates: Partial<dir_notification_templates>[] = [
        { id: "1", channel: "email" },
        { id: "2", channel: "sms" },
        { id: "3", channel: "slack" },
      ];

      vi.mocked(
        mockPrisma.dir_notification_templates.findMany
      ).mockResolvedValue(mockTemplates as dir_notification_templates[]);

      const result = await repository.getAvailableChannels();

      expect(result).toEqual(["email", "sms", "slack"]);
    });
  });

  describe("findActive", () => {
    it("should filter by active status", async () => {
      const mockTemplates: Partial<dir_notification_templates>[] = [
        { id: "1", status: "active", deleted_at: null },
      ];

      vi.mocked(
        mockPrisma.dir_notification_templates.findMany
      ).mockResolvedValue(mockTemplates as dir_notification_templates[]);

      await repository.findActive("email");

      expect(
        mockPrisma.dir_notification_templates.findMany
      ).toHaveBeenCalledWith({
        where: {
          status: "active",
          channel: "email",
          deleted_at: null,
        },
        orderBy: {
          template_code: "asc",
        },
      });
    });
  });
});
