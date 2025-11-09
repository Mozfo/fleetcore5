/**
 * Notification Validators Unit Tests
 * Tests Zod schemas and utility validation functions
 */

import { describe, it, expect } from "vitest";
import {
  countryCodeSchema,
  localeSchema,
  notificationChannelSchema,
  notificationStatusSchema,
  templateVariablesSchema,
  sendEmailSchema,
  queryHistorySchema,
  updateNotificationStatusSchema,
  resendWebhookSchema,
  getStatsSchema,
  selectTemplateSchema,
  isValidTemplateCode,
  isValidCountryCode,
  isValidLocale,
} from "../notification.validators";

describe("Notification Validators", () => {
  describe("countryCodeSchema - ISO 3166-1 alpha-2", () => {
    it("should validate FR country code", () => {
      const result = countryCodeSchema.safeParse("FR");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("FR");
      }
    });

    it("should validate AE country code", () => {
      const result = countryCodeSchema.safeParse("AE");
      expect(result.success).toBe(true);
    });

    it("should reject lowercase country code", () => {
      const result = countryCodeSchema.safeParse("fr");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("2 uppercase letters");
      }
    });

    it("should reject 3-letter code", () => {
      const result = countryCodeSchema.safeParse("FRA");
      expect(result.success).toBe(false);
    });

    it("should reject numbers", () => {
      const result = countryCodeSchema.safeParse("F1");
      expect(result.success).toBe(false);
    });
  });

  describe("localeSchema - ISO 639-1", () => {
    it("should validate 'en' locale", () => {
      const result = localeSchema.safeParse("en");
      expect(result.success).toBe(true);
    });

    it("should validate 'fr' locale", () => {
      const result = localeSchema.safeParse("fr");
      expect(result.success).toBe(true);
    });

    it("should validate 'en-US' with region", () => {
      const result = localeSchema.safeParse("en-US");
      expect(result.success).toBe(true);
    });

    it("should validate 'ar-SA' with region", () => {
      const result = localeSchema.safeParse("ar-SA");
      expect(result.success).toBe(true);
    });

    it("should reject uppercase locale", () => {
      const result = localeSchema.safeParse("EN");
      expect(result.success).toBe(false);
    });

    it("should reject invalid format", () => {
      const result = localeSchema.safeParse("en_US");
      expect(result.success).toBe(false);
    });

    it("should reject 3-letter locale", () => {
      const result = localeSchema.safeParse("eng");
      expect(result.success).toBe(false);
    });
  });

  describe("notificationChannelSchema", () => {
    it("should validate 'email' channel", () => {
      const result = notificationChannelSchema.safeParse("email");
      expect(result.success).toBe(true);
    });

    it("should validate 'sms' channel", () => {
      const result = notificationChannelSchema.safeParse("sms");
      expect(result.success).toBe(true);
    });

    it("should validate 'slack' channel", () => {
      const result = notificationChannelSchema.safeParse("slack");
      expect(result.success).toBe(true);
    });

    it("should reject invalid channel", () => {
      const result = notificationChannelSchema.safeParse("telegram");
      expect(result.success).toBe(false);
    });
  });

  describe("notificationStatusSchema", () => {
    it("should validate all status values", () => {
      const statuses = [
        "pending",
        "sent",
        "delivered",
        "bounced",
        "opened",
        "clicked",
        "failed",
      ];

      statuses.forEach((status) => {
        const result = notificationStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status", () => {
      const result = notificationStatusSchema.safeParse("unknown");
      expect(result.success).toBe(false);
    });
  });

  describe("templateVariablesSchema", () => {
    it("should validate string variables", () => {
      const result = templateVariablesSchema.safeParse({
        user_name: "John Doe",
        tenant_name: "FleetCore",
      });
      expect(result.success).toBe(true);
    });

    it("should validate number variables", () => {
      const result = templateVariablesSchema.safeParse({
        vehicle_count: 42,
        price: 99.99,
      });
      expect(result.success).toBe(true);
    });

    it("should validate boolean variables", () => {
      const result = templateVariablesSchema.safeParse({
        is_verified: true,
        has_insurance: false,
      });
      expect(result.success).toBe(true);
    });

    it("should validate Date variables", () => {
      const result = templateVariablesSchema.safeParse({
        expiry_date: new Date("2025-12-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should validate null variables", () => {
      const result = templateVariablesSchema.safeParse({
        middle_name: null,
      });
      expect(result.success).toBe(true);
    });

    it("should validate mixed types", () => {
      const result = templateVariablesSchema.safeParse({
        user_name: "John",
        age: 30,
        is_active: true,
        signup_date: new Date(),
        middle_name: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid key format", () => {
      const result = templateVariablesSchema.safeParse({
        "user-name": "John", // Hyphen not allowed
      });
      expect(result.success).toBe(false);
    });

    it("should reject array values", () => {
      const result = templateVariablesSchema.safeParse({
        tags: ["fleet", "driver"],
      });
      expect(result.success).toBe(false);
    });

    it("should reject object values", () => {
      const result = templateVariablesSchema.safeParse({
        user: { name: "John" },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("sendEmailSchema - CASCADE parameters", () => {
    it("should validate minimal email send request", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        templateCode: "lead_confirmation",
        variables: { name: "John" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fallbackLocale).toBe("en"); // Default
      }
    });

    it("should validate full CASCADE parameters", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        recipientPhone: "+33612345678",
        templateCode: "member_welcome",
        variables: { user_name: "John" },
        userId: "550e8400-e29b-41d4-a716-446655440000",
        tenantId: "550e8400-e29b-41d4-a716-446655440001",
        leadId: "550e8400-e29b-41d4-a716-446655440002",
        countryCode: "FR",
        fallbackLocale: "fr",
        metadata: {
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          sessionId: "550e8400-e29b-41d4-a716-446655440003",
          requestId: "550e8400-e29b-41d4-a716-446655440004",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "invalid-email",
        templateCode: "test",
        variables: {},
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid phone format", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        recipientPhone: "06 12 34 56 78", // Not E.164
        templateCode: "test",
        variables: {},
      });
      expect(result.success).toBe(false);
    });

    it("should validate E.164 phone with country code", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        recipientPhone: "+33612345678",
        templateCode: "test",
        variables: {},
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid template code format", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        templateCode: "Lead-Confirmation", // Must be lowercase with underscores
        variables: {},
      });
      expect(result.success).toBe(false);
    });

    it("should validate template code with underscores", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        templateCode: "lead_confirmation",
        variables: {},
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for userId", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        templateCode: "test",
        variables: {},
        userId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid country code", () => {
      const result = sendEmailSchema.safeParse({
        recipientEmail: "user@example.com",
        templateCode: "test",
        variables: {},
        countryCode: "FRA", // Must be 2 letters
      });
      expect(result.success).toBe(false);
    });
  });

  describe("queryHistorySchema - pagination and filters", () => {
    it("should validate with default pagination", () => {
      const result = queryHistorySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe("created_at");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("should validate custom pagination", () => {
      const result = queryHistorySchema.safeParse({
        page: "2",
        limit: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should coerce string numbers to integers", () => {
      const result = queryHistorySchema.safeParse({
        page: "3",
        limit: "100",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe("number");
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("should reject limit > 100", () => {
      const result = queryHistorySchema.safeParse({
        limit: "150",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      const result = queryHistorySchema.safeParse({
        page: "-1",
      });
      expect(result.success).toBe(false);
    });

    it("should validate all filters", () => {
      const result = queryHistorySchema.safeParse({
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
        recipientId: "550e8400-e29b-41d4-a716-446655440001",
        recipientEmail: "user@example.com",
        status: "delivered",
        templateCode: "member_welcome",
        channel: "email",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });
      expect(result.success).toBe(true);
    });

    it("should coerce ISO date strings to Date objects", () => {
      const result = queryHistorySchema.safeParse({
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-01-31T23:59:59Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it("should validate all sortBy fields", () => {
      const sortFields = [
        "created_at",
        "sent_at",
        "delivered_at",
        "opened_at",
        "clicked_at",
        "failed_at",
        "status",
        "template_code",
        "recipient_email",
      ];

      sortFields.forEach((field) => {
        const result = queryHistorySchema.safeParse({ sortBy: field });
        expect(result.success).toBe(true);
      });
    });

    it("should validate sortOrder asc/desc", () => {
      const result1 = queryHistorySchema.safeParse({ sortOrder: "asc" });
      expect(result1.success).toBe(true);

      const result2 = queryHistorySchema.safeParse({ sortOrder: "desc" });
      expect(result2.success).toBe(true);
    });
  });

  describe("updateNotificationStatusSchema", () => {
    it("should validate status update with timestamps", () => {
      const result = updateNotificationStatusSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "delivered",
        sent_at: "2025-01-09T10:00:00Z",
        delivered_at: "2025-01-09T10:01:00Z",
        external_id: "re_abc123",
      });
      expect(result.success).toBe(true);
    });

    it("should coerce date strings to Date objects", () => {
      const result = updateNotificationStatusSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "opened",
        opened_at: "2025-01-09T10:05:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.opened_at).toBeInstanceOf(Date);
      }
    });

    it("should validate failed status with error message", () => {
      const result = updateNotificationStatusSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "failed",
        failed_at: "2025-01-09T10:00:00Z",
        error_message: "SMTP connection timeout",
      });
      expect(result.success).toBe(true);
    });

    it("should reject error_message > 1000 chars", () => {
      const result = updateNotificationStatusSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "failed",
        error_message: "x".repeat(1001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resendWebhookSchema - Resend event types", () => {
    it("should validate email.sent event", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.sent",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:00:00Z",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate email.delivered event", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.delivered",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:01:00Z",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate email.opened with full payload", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.opened",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:05:00Z",
          from: "notifications@fleetcore.app",
          to: ["user@example.com"],
          subject: "Welcome to FleetCore",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate email.clicked event", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.clicked",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:10:00Z",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should validate email.bounced event", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.bounced",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:00:00Z",
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject unknown event type", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.spam",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09T10:00:00Z",
        },
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid ISO 8601 timestamp", () => {
      const result = resendWebhookSchema.safeParse({
        type: "email.sent",
        data: {
          email_id: "re_abc123",
          created_at: "2025-01-09 10:00:00", // Not ISO 8601
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getStatsSchema", () => {
    it("should validate with no filters", () => {
      const result = getStatsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate with tenant filter", () => {
      const result = getStatsSchema.safeParse({
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with date range", () => {
      const result = getStatsSchema.safeParse({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("selectTemplateSchema - CASCADE levels", () => {
    it("should validate with fallback only (CASCADE level 6)", () => {
      const result = selectTemplateSchema.safeParse({
        templateCode: "lead_confirmation",
        channel: "email",
        fallbackLocale: "en",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with userId (CASCADE level 1)", () => {
      const result = selectTemplateSchema.safeParse({
        templateCode: "test",
        channel: "email",
        userId: "550e8400-e29b-41d4-a716-446655440000",
        fallbackLocale: "en",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with tenantId (CASCADE level 3)", () => {
      const result = selectTemplateSchema.safeParse({
        templateCode: "test",
        channel: "email",
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
        fallbackLocale: "en",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with leadId (CASCADE level 4)", () => {
      const result = selectTemplateSchema.safeParse({
        templateCode: "test",
        channel: "email",
        leadId: "550e8400-e29b-41d4-a716-446655440000",
        fallbackLocale: "en",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with countryCode (CASCADE level 5)", () => {
      const result = selectTemplateSchema.safeParse({
        templateCode: "test",
        channel: "email",
        countryCode: "FR",
        fallbackLocale: "en",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all CASCADE parameters", () => {
      const result = selectTemplateSchema.safeParse({
        templateCode: "member_welcome",
        channel: "email",
        userId: "550e8400-e29b-41d4-a716-446655440000",
        tenantId: "550e8400-e29b-41d4-a716-446655440001",
        leadId: "550e8400-e29b-41d4-a716-446655440002",
        countryCode: "AE",
        fallbackLocale: "ar",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Utility Functions", () => {
    describe("isValidTemplateCode", () => {
      it("should validate lowercase alphanumeric with underscores", () => {
        expect(isValidTemplateCode("lead_confirmation")).toBe(true);
        expect(isValidTemplateCode("member_welcome")).toBe(true);
        expect(isValidTemplateCode("test123")).toBe(true);
      });

      it("should reject uppercase", () => {
        expect(isValidTemplateCode("Lead_Confirmation")).toBe(false);
      });

      it("should reject hyphens", () => {
        expect(isValidTemplateCode("lead-confirmation")).toBe(false);
      });

      it("should reject empty string", () => {
        expect(isValidTemplateCode("")).toBe(false);
      });

      it("should reject > 100 chars", () => {
        expect(isValidTemplateCode("x".repeat(101))).toBe(false);
      });
    });

    describe("isValidCountryCode", () => {
      it("should validate 2 uppercase letters", () => {
        expect(isValidCountryCode("FR")).toBe(true);
        expect(isValidCountryCode("AE")).toBe(true);
        expect(isValidCountryCode("GB")).toBe(true);
      });

      it("should reject lowercase", () => {
        expect(isValidCountryCode("fr")).toBe(false);
      });

      it("should reject 3 letters", () => {
        expect(isValidCountryCode("FRA")).toBe(false);
      });

      it("should reject numbers", () => {
        expect(isValidCountryCode("F1")).toBe(false);
      });
    });

    describe("isValidLocale", () => {
      it("should validate 2 lowercase letters", () => {
        expect(isValidLocale("en")).toBe(true);
        expect(isValidLocale("fr")).toBe(true);
        expect(isValidLocale("ar")).toBe(true);
      });

      it("should validate with region code", () => {
        expect(isValidLocale("en-US")).toBe(true);
        expect(isValidLocale("fr-FR")).toBe(true);
        expect(isValidLocale("ar-SA")).toBe(true);
      });

      it("should reject uppercase", () => {
        expect(isValidLocale("EN")).toBe(false);
      });

      it("should reject underscore separator", () => {
        expect(isValidLocale("en_US")).toBe(false);
      });

      it("should reject 3 letters", () => {
        expect(isValidLocale("eng")).toBe(false);
      });
    });
  });
});
