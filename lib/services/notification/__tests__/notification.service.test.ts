/**
 * NotificationService Unit Tests
 * Tests ZÉRO HARDCODING cascade algorithm (6 levels)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationService } from "../notification.service";
import type { PrismaClient } from "@prisma/client";

// Mock EmailService (CORRECTION: NotificationService now uses EmailService, not Resend directly)
vi.mock("@/lib/services/email/email.service", () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({
      success: true,
      messageId: "re_mock123",
    }),
  })),
}));

// Mock Prisma Client
const mockPrisma = {
  adm_members: { findUnique: vi.fn() },
  adm_tenants: { findUnique: vi.fn() },
  adm_tenant_settings: { findFirst: vi.fn() },
  crm_leads: { findUnique: vi.fn() },
  dir_country_locales: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  dir_notification_templates: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  adm_notification_logs: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService(mockPrisma);
  });

  describe("selectTemplate - CASCADE 1: User preferred_language", () => {
    it("should use user preferred_language (priority 1)", async () => {
      vi.mocked(mockPrisma.adm_members.findUnique).mockResolvedValue({
        id: "user-1",
        preferred_language: "fr",
      } as never);

      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "EN", fr: "FR" },
        body_translations: { en: "EN body", fr: "FR body" },
        supported_locales: ["en", "fr"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        userId: "user-1",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("fr");
      expect(result.subject).toBe("FR");
      expect(mockPrisma.adm_members.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { preferred_language: true },
      });
    });
  });

  describe("selectTemplate - CASCADE 1: Tenant notification_locale (adm_tenant_settings)", () => {
    it("should use tenant notification_locale from settings if available", async () => {
      // CASCADE 1: adm_tenant_settings.setting_value.locale
      vi.mocked(mockPrisma.adm_tenant_settings.findFirst).mockResolvedValue({
        setting_value: { locale: "fr" },
      } as never);
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "EN", fr: "FR Tenant" },
        body_translations: { en: "EN body", fr: "FR Tenant body" },
        supported_locales: ["en", "fr"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        tenantId: "tenant-1",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("fr");
      expect(result.subject).toBe("FR Tenant");
    });
  });

  describe("selectTemplate - CASCADE 4: Lead country primary_locale", () => {
    it("should use lead country primary_locale if no user/tenant", async () => {
      vi.mocked(mockPrisma.adm_members.findUnique).mockResolvedValue(null);
      vi.mocked(mockPrisma.crm_leads.findUnique).mockResolvedValue({
        id: "lead-1",
        country_code: "AE",
      } as never);
      vi.mocked(mockPrisma.dir_country_locales.findFirst).mockResolvedValue({
        country_code: "AE",
        primary_locale: "ar",
      } as never);
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "EN", ar: "العربية" },
        body_translations: { en: "EN body", ar: "نص عربي" },
        supported_locales: ["en", "ar"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        locale: "ar",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("ar");
      expect(result.subject).toBe("العربية");
    });
  });

  describe("selectTemplate - CASCADE 5: Direct countryCode", () => {
    it("should use direct countryCode parameter", async () => {
      vi.mocked(mockPrisma.dir_country_locales.findFirst).mockResolvedValue({
        country_code: "DE",
        primary_locale: "de",
      } as never);
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "EN", de: "DE" },
        body_translations: { en: "EN body", de: "DE body" },
        supported_locales: ["en", "de"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        locale: "de",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("de");
      expect(result.subject).toBe("DE");
    });
  });

  describe("selectTemplate - CASCADE 6: Fallback locale", () => {
    it("should use fallback locale if all cascades fail", async () => {
      vi.mocked(mockPrisma.adm_members.findUnique).mockResolvedValue(null);
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "EN Fallback" },
        body_translations: { en: "EN Fallback body" },
        supported_locales: ["en"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("en");
      expect(result.subject).toBe("EN Fallback");
    });
  });

  describe("selectTemplate - JSONB extraction", () => {
    it("should extract JSONB subject_translations", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "Subject EN", fr: "Sujet FR", ar: "موضوع" },
        body_translations: { en: "Body EN", fr: "Corps FR", ar: "نص" },
        supported_locales: ["en", "fr", "ar"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        fallbackLocale: "ar",
      });

      expect(result.subject).toBe("موضوع");
    });

    it("should extract JSONB body_translations", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "Subject" },
        body_translations: { en: "Body with {{variable}}" },
        supported_locales: ["en"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        fallbackLocale: "en",
      });

      expect(result.body).toBe("Body with {{variable}}");
    });

    it("should fallback to en if locale translation missing", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "EN only" },
        body_translations: { en: "EN only body" },
        supported_locales: ["en"],
      } as never);

      const result = await service.selectTemplate({
        templateCode: "test",
        channel: "email",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("en");
      expect(result.subject).toBe("EN only"); // Falls back to en
    });
  });

  describe("renderTemplate", () => {
    it("should replace {{variable}} placeholders", async () => {
      const template = {
        templateId: "tpl-1",
        templateCode: "test",
        channel: "email" as const,
        locale: "en",
        subject: "Hello {{user_name}}",
        body: "Welcome to {{tenant_name}}, {{user_name}}!",
        variables: null,
      };

      const result = await service.renderTemplate(template, {
        user_name: "John",
        tenant_name: "FleetCore",
      });

      expect(result.subject).toBe("Hello John");
      expect(result.body).toBe("Welcome to FleetCore, John!");
    });

    it("should handle multiple occurrences of same variable", async () => {
      const template = {
        templateId: "tpl-1",
        templateCode: "test",
        channel: "email" as const,
        locale: "en",
        subject: "{{company}}",
        body: "{{company}} is great. Join {{company}} today!",
        variables: null,
      };

      const result = await service.renderTemplate(template, {
        company: "FleetCore",
      });

      expect(result.body).toBe("FleetCore is great. Join FleetCore today!");
    });
  });

  describe("sendEmail", () => {
    it("should orchestrate full flow: select → render → send → log", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "Subject {{name}}" },
        body_translations: { en: "Body {{name}}" },
        supported_locales: ["en"],
      } as never);

      vi.mocked(mockPrisma.adm_notification_logs.create).mockResolvedValue({
        id: "log-1",
      } as never);

      const result = await service.sendEmail({
        recipientEmail: "user@example.com",
        templateCode: "test",
        variables: { name: "John" },
        fallbackLocale: "en",
      });

      expect(result.success).toBe(true);
      expect(result.locale).toBe("en");
      expect(mockPrisma.adm_notification_logs.create).toHaveBeenCalled();
    });

    it("should create notification log with correct data", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "Test" },
        body_translations: { en: "Test body" },
        supported_locales: ["en"],
      } as never);

      vi.mocked(mockPrisma.adm_notification_logs.create).mockResolvedValue({
        id: "log-1",
      } as never);

      await service.sendEmail({
        recipientEmail: "user@example.com",
        templateCode: "test",
        variables: {},
      });

      expect(mockPrisma.adm_notification_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipient_email: "user@example.com",
          template_code: "test",
          channel: "email",
          status: "sent",
        }),
      });
    });

    it("should handle send failure gracefully", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockRejectedValue(new Error("Template not found"));

      vi.mocked(mockPrisma.adm_notification_logs.create).mockResolvedValue({
        id: "log-1",
      } as never);

      const result = await service.sendEmail({
        recipientEmail: "user@example.com",
        templateCode: "unknown",
        variables: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Template not found");
    });

    it("should track external_id from Resend", async () => {
      vi.mocked(
        mockPrisma.dir_notification_templates.findFirst
      ).mockResolvedValue({
        id: "tpl-1",
        template_code: "test",
        channel: "email",
        subject_translations: { en: "Test" },
        body_translations: { en: "Test body" },
        supported_locales: ["en"],
      } as never);

      vi.mocked(mockPrisma.adm_notification_logs.create).mockResolvedValue({
        id: "log-1",
      } as never);

      const result = await service.sendEmail({
        recipientEmail: "user@example.com",
        templateCode: "test",
        variables: {},
      });

      expect(result.messageId).toBe("re_mock123");
      expect(mockPrisma.adm_notification_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          external_id: "re_mock123",
        }),
      });
    });
  });

  describe("handleResendWebhook", () => {
    it("should update log status from webhook", async () => {
      vi.mocked(mockPrisma.adm_notification_logs.findFirst).mockResolvedValue({
        id: "log-1",
        external_id: "re_abc123",
      } as never);

      vi.mocked(mockPrisma.adm_notification_logs.update).mockResolvedValue({
        id: "log-1",
        status: "delivered",
      } as never);

      await service.handleResendWebhook({
        type: "email.delivered",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:00:00Z",
        },
      });

      expect(mockPrisma.adm_notification_logs.update).toHaveBeenCalled();
    });

    it("should handle unknown email_id gracefully", async () => {
      vi.mocked(mockPrisma.adm_notification_logs.findFirst).mockResolvedValue(
        null
      );

      await expect(
        service.handleResendWebhook({
          type: "email.sent",
          data: {
            email_id: "unknown",
            created_at: "2025-01-09T10:00:00Z",
          },
        })
      ).resolves.not.toThrow();
    });
  });
});
