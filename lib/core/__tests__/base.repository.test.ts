/**
 * Tests for BaseRepository.restore()
 * lib/core/base.repository.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseRepository } from "../base.repository";
import type { SortFieldWhitelist } from "../validation";

// Test entity type
interface TestEntity {
  id: string;
  tenant_id: string;
  deleted_at: Date | null;
  deleted_by: string | null;
  deletion_reason: string | null;
  updated_by: string;
  updated_at: Date;
}

// Concrete implementation for testing
class TestRepository extends BaseRepository<TestEntity> {
  protected getSortWhitelist(): SortFieldWhitelist {
    return ["id", "created_at"];
  }
}

describe("BaseRepository", () => {
  describe("restore", () => {
    let repository: TestRepository;
    let mockModel: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockModel = {
        findFirst: vi.fn(),
        update: vi.fn(),
      };

      repository = new TestRepository(
        mockModel,
        {} as ConstructorParameters<typeof TestRepository>[1]
      );
    });

    it("should restore a deleted entity successfully", async () => {
      const deletedEntity: TestEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: new Date(),
        deleted_by: "member-1",
        deletion_reason: "Test deletion",
        updated_by: "member-1",
        updated_at: new Date(),
      };

      const restoredEntity: TestEntity = {
        ...deletedEntity,
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
        updated_by: "member-2",
        updated_at: new Date(),
      };

      mockModel.findFirst.mockResolvedValue(deletedEntity);
      mockModel.update.mockResolvedValue(restoredEntity);

      const result = await repository.restore("entity-1", "member-2");

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: "entity-1" },
      });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: "entity-1" },
        data: {
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
          updated_by: "member-2",
          updated_at: expect.any(Date),
        },
      });

      expect(result).toEqual(restoredEntity);
    });

    it("should restore with tenant filtering", async () => {
      const deletedEntity: TestEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: new Date(),
        deleted_by: "member-1",
        deletion_reason: null,
        updated_by: "member-1",
        updated_at: new Date(),
      };

      mockModel.findFirst.mockResolvedValue(deletedEntity);
      mockModel.update.mockResolvedValue({
        ...deletedEntity,
        deleted_at: null,
      });

      await repository.restore("entity-1", "member-2", "tenant-1");

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { id: "entity-1", tenant_id: "tenant-1" },
      });
    });

    it("should throw error if entity not found", async () => {
      mockModel.findFirst.mockResolvedValue(null);

      await expect(repository.restore("entity-1", "member-2")).rejects.toThrow(
        "Entity with id entity-1 not found"
      );
    });

    it("should throw error if entity is not deleted", async () => {
      const notDeletedEntity: TestEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
        updated_by: "member-1",
        updated_at: new Date(),
      };

      mockModel.findFirst.mockResolvedValue(notDeletedEntity);

      await expect(repository.restore("entity-1", "member-2")).rejects.toThrow(
        "Entity with id entity-1 is not deleted"
      );
    });

    it("should clear deletion_reason when restoring", async () => {
      const deletedEntity: TestEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: new Date(),
        deleted_by: "member-1",
        deletion_reason: "User requested deletion",
        updated_by: "member-1",
        updated_at: new Date(),
      };

      mockModel.findFirst.mockResolvedValue(deletedEntity);
      mockModel.update.mockResolvedValue({
        ...deletedEntity,
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
      });

      await repository.restore("entity-1", "member-2");

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: "entity-1" },
        data: expect.objectContaining({
          deletion_reason: null,
        }),
      });
    });

    it("should update updated_by and updated_at when restoring", async () => {
      const deletedEntity: TestEntity = {
        id: "entity-1",
        tenant_id: "tenant-1",
        deleted_at: new Date(),
        deleted_by: "member-1",
        deletion_reason: null,
        updated_by: "member-1",
        updated_at: new Date("2024-01-01"),
      };

      mockModel.findFirst.mockResolvedValue(deletedEntity);
      mockModel.update.mockResolvedValue({
        ...deletedEntity,
        deleted_at: null,
      });

      const beforeRestore = new Date();
      await repository.restore("entity-1", "member-2");
      const afterRestore = new Date();

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: "entity-1" },
        data: expect.objectContaining({
          updated_by: "member-2",
          updated_at: expect.any(Date),
        }),
      });

      const updateCall = mockModel.update.mock.calls[0][0];
      const updatedAt = updateCall.data.updated_at;
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeRestore.getTime()
      );
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterRestore.getTime());
    });
  });
});
