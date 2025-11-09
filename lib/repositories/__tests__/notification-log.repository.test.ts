/**
 * NotificationLogRepository Unit Tests
 * Tests Resend webhook tracking and analytics
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationLogRepository } from "../notification-log.repository";
import type { PrismaClient, adm_notification_logs } from "@prisma/client";

// Mock Prisma Client
const mockPrisma = {
  adm_notification_logs: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
  },
} as unknown as PrismaClient;

describe("NotificationLogRepository", () => {
  let repository: NotificationLogRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new NotificationLogRepository(mockPrisma);
  });

  describe("updateStatus", () => {
    it("should update status from pending to sent", async () => {
      const mockLog: Partial<adm_notification_logs> = {
        id: "log-1",
        status: "sent",
        sent_at: new Date(),
      };

      vi.mocked(mockPrisma.adm_notification_logs.update).mockResolvedValue(
        mockLog as adm_notification_logs
      );

      const result = await repository.updateStatus("log-1", "sent", {
        sent_at: new Date(),
      });

      expect(result.status).toBe("sent");
      expect(mockPrisma.adm_notification_logs.update).toHaveBeenCalledWith({
        where: {
          id: "log-1",
          deleted_at: null,
        },
        data: expect.objectContaining({
          status: "sent",
          sent_at: expect.any(Date),
        }),
      });
    });

    it("should set sent_at timestamp", async () => {
      const sentAt = new Date("2025-01-09T10:00:00Z");
      const mockLog: Partial<adm_notification_logs> = {
        id: "log-1",
        status: "sent",
        sent_at: sentAt,
      };

      vi.mocked(mockPrisma.adm_notification_logs.update).mockResolvedValue(
        mockLog as adm_notification_logs
      );

      await repository.updateStatus("log-1", "sent", { sent_at: sentAt });

      expect(mockPrisma.adm_notification_logs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sent_at: sentAt,
          }),
        })
      );
    });

    it("should handle Resend webhook delivery", async () => {
      const deliveredAt = new Date();
      const mockLog: Partial<adm_notification_logs> = {
        id: "log-1",
        status: "delivered",
        delivered_at: deliveredAt,
      };

      vi.mocked(mockPrisma.adm_notification_logs.update).mockResolvedValue(
        mockLog as adm_notification_logs
      );

      await repository.updateStatus("log-1", "delivered", {
        delivered_at: deliveredAt,
      });

      expect(mockPrisma.adm_notification_logs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "delivered",
            delivered_at: deliveredAt,
          }),
        })
      );
    });
  });

  describe("findByRecipient", () => {
    it("should find logs by recipient_id", async () => {
      const mockLogs: Partial<adm_notification_logs>[] = [
        { id: "log-1", recipient_id: "user-1", deleted_at: null },
        { id: "log-2", recipient_id: "user-1", deleted_at: null },
      ];

      vi.mocked(mockPrisma.adm_notification_logs.count).mockResolvedValue(2);
      vi.mocked(mockPrisma.adm_notification_logs.findMany).mockResolvedValue(
        mockLogs as adm_notification_logs[]
      );

      const result = await repository.findByRecipient("user-1");

      expect(result.data).toHaveLength(2);
    });

    it("should filter by tenant_id", async () => {
      vi.mocked(mockPrisma.adm_notification_logs.count).mockResolvedValue(0);
      vi.mocked(mockPrisma.adm_notification_logs.findMany).mockResolvedValue(
        []
      );

      await repository.findByRecipient("user-1", "tenant-123");

      expect(mockPrisma.adm_notification_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recipient_id: "user-1",
            tenant_id: "tenant-123",
            deleted_at: null,
          }),
        })
      );
    });

    it("should handle null tenant_id for CRM", async () => {
      vi.mocked(mockPrisma.adm_notification_logs.count).mockResolvedValue(0);
      vi.mocked(mockPrisma.adm_notification_logs.findMany).mockResolvedValue(
        []
      );

      await repository.findByRecipient("user-1", undefined);

      expect(mockPrisma.adm_notification_logs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            tenant_id: expect.anything(),
          }),
        })
      );
    });
  });

  describe("getStats", () => {
    it("should aggregate by status", async () => {
      vi.mocked(mockPrisma.adm_notification_logs.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(80) // sent
        .mockResolvedValueOnce(75) // delivered
        .mockResolvedValueOnce(2) // bounced
        .mockResolvedValueOnce(30) // opened
        .mockResolvedValueOnce(10) // clicked
        .mockResolvedValueOnce(3); // failed

      const stats = await repository.getStats("tenant-123");

      expect(stats).toEqual({
        total: 100,
        pending: 5,
        sent: 80,
        delivered: 75,
        bounced: 2,
        opened: 30,
        clicked: 10,
        failed: 3,
      });
    });

    it("should filter by date range", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-31");

      vi.mocked(mockPrisma.adm_notification_logs.count).mockResolvedValue(50);

      await repository.getStats("tenant-123", startDate, endDate);

      // Verify at least one count call includes date filter
      expect(mockPrisma.adm_notification_logs.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });

  describe("findByExternalId", () => {
    it("should find log by Resend message ID", async () => {
      const mockLog: Partial<adm_notification_logs> = {
        id: "log-1",
        external_id: "re_abc123",
        deleted_at: null,
      };

      vi.mocked(mockPrisma.adm_notification_logs.findFirst).mockResolvedValue(
        mockLog as adm_notification_logs
      );

      const result = await repository.findByExternalId("re_abc123");

      expect(result?.external_id).toBe("re_abc123");
      expect(mockPrisma.adm_notification_logs.findFirst).toHaveBeenCalledWith({
        where: {
          external_id: "re_abc123",
          deleted_at: null,
        },
      });
    });
  });

  describe("getTemplateStats", () => {
    it("should return top templates by usage", async () => {
      const mockStats = [
        {
          template_code: "lead_confirmation",
          channel: "email" as const,
          _count: { id: 500 },
        },
        {
          template_code: "member_welcome",
          channel: "email" as const,
          _count: { id: 300 },
        },
      ];

      vi.mocked(mockPrisma.adm_notification_logs.groupBy).mockResolvedValue(
        mockStats as never
      );

      const result = await repository.getTemplateStats("tenant-123", 5);

      expect(result).toEqual([
        { template_code: "lead_confirmation", channel: "email", count: 500 },
        { template_code: "member_welcome", channel: "email", count: 300 },
      ]);
    });
  });
});
