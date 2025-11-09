/**
 * CountryLocaleRepository Unit Tests
 * Tests all methods with mock Prisma client
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CountryLocaleRepository } from "../country-locale.repository";
import type { PrismaClient, dir_country_locales } from "@prisma/client";

// Mock Prisma Client
const mockPrisma = {
  dir_country_locales: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

describe("CountryLocaleRepository", () => {
  let repository: CountryLocaleRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new CountryLocaleRepository(mockPrisma);
  });

  describe("findByCountryCode", () => {
    it("should find France by FR code", async () => {
      const mockFrance: Partial<dir_country_locales> = {
        id: "country-fr",
        country_code: "FR",
        country_name: "France",
        primary_locale: "fr",
        fallback_locale: "en",
        supported_locales: ["fr", "en"],
        timezone: "Europe/Paris",
        currency: "EUR",
        deleted_at: null,
      };

      vi.mocked(mockPrisma.dir_country_locales.findFirst).mockResolvedValue(
        mockFrance as dir_country_locales
      );

      const result = await repository.findByCountryCode("FR");

      expect(result).toEqual(mockFrance);
      expect(mockPrisma.dir_country_locales.findFirst).toHaveBeenCalledWith({
        where: {
          country_code: "FR",
          deleted_at: null,
        },
      });
    });

    it("should return null for unknown code", async () => {
      vi.mocked(mockPrisma.dir_country_locales.findFirst).mockResolvedValue(
        null
      );

      const result = await repository.findByCountryCode("XX");

      expect(result).toBeNull();
    });

    it("should filter deleted countries", async () => {
      vi.mocked(mockPrisma.dir_country_locales.findFirst).mockResolvedValue(
        null
      );

      await repository.findByCountryCode("FR");

      expect(mockPrisma.dir_country_locales.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deleted_at: null,
        }),
      });
    });
  });

  describe("findByPrimaryLocale", () => {
    it("should find countries with French as primary locale", async () => {
      const mockCountries: Partial<dir_country_locales>[] = [
        {
          id: "fr",
          country_code: "FR",
          country_name: "France",
          primary_locale: "fr",
        },
        {
          id: "be",
          country_code: "BE",
          country_name: "Belgium",
          primary_locale: "fr",
        },
      ];

      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue(
        mockCountries as dir_country_locales[]
      );

      const result = await repository.findByPrimaryLocale("fr");

      expect(result).toHaveLength(2);
      expect(mockPrisma.dir_country_locales.findMany).toHaveBeenCalledWith({
        where: {
          primary_locale: "fr",
          deleted_at: null,
        },
        orderBy: {
          country_name: "asc",
        },
      });
    });

    it("should return empty array if no match", async () => {
      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue([]);

      const result = await repository.findByPrimaryLocale("xx");

      expect(result).toEqual([]);
    });
  });

  describe("findBySupportedLocale", () => {
    it("should find countries supporting English", async () => {
      const mockCountries: Partial<dir_country_locales>[] = [
        {
          id: "gb",
          country_code: "GB",
          supported_locales: ["en"],
          deleted_at: null,
        },
        {
          id: "us",
          country_code: "US",
          supported_locales: ["en", "es"],
          deleted_at: null,
        },
      ];

      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue(
        mockCountries as dir_country_locales[]
      );

      const result = await repository.findBySupportedLocale("en");

      expect(result).toHaveLength(2);
      expect(mockPrisma.dir_country_locales.findMany).toHaveBeenCalledWith({
        where: {
          supported_locales: {
            has: "en",
          },
          deleted_at: null,
        },
        orderBy: {
          country_name: "asc",
        },
      });
    });

    it("should use PostgreSQL array operator", async () => {
      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue([]);

      await repository.findBySupportedLocale("ar");

      expect(mockPrisma.dir_country_locales.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supported_locales: { has: "ar" },
          }),
        })
      );
    });
  });

  describe("findActive", () => {
    it("should find only active countries", async () => {
      const mockCountries: Partial<dir_country_locales>[] = [
        { id: "fr", status: "active", deleted_at: null },
        { id: "gb", status: "active", deleted_at: null },
      ];

      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue(
        mockCountries as dir_country_locales[]
      );

      const _result = await repository.findActive();

      expect(mockPrisma.dir_country_locales.findMany).toHaveBeenCalledWith({
        where: {
          status: "active",
          deleted_at: null,
        },
        orderBy: {
          country_name: "asc",
        },
      });
    });
  });

  describe("findRTL", () => {
    it("should find RTL-enabled countries", async () => {
      const mockCountries: Partial<dir_country_locales>[] = [
        { id: "ae", country_code: "AE", rtl_enabled: true, deleted_at: null },
        { id: "sa", country_code: "SA", rtl_enabled: true, deleted_at: null },
      ];

      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue(
        mockCountries as dir_country_locales[]
      );

      const _result = await repository.findRTL();

      expect(mockPrisma.dir_country_locales.findMany).toHaveBeenCalledWith({
        where: {
          rtl_enabled: true,
          deleted_at: null,
        },
        orderBy: {
          country_name: "asc",
        },
      });
    });
  });

  describe("countryExists", () => {
    it("should return true if country exists", async () => {
      vi.mocked(mockPrisma.dir_country_locales.count).mockResolvedValue(1);

      const result = await repository.countryExists("FR");

      expect(result).toBe(true);
      expect(mockPrisma.dir_country_locales.count).toHaveBeenCalledWith({
        where: {
          country_code: "FR",
          deleted_at: null,
        },
      });
    });

    it("should return false if country does not exist", async () => {
      vi.mocked(mockPrisma.dir_country_locales.count).mockResolvedValue(0);

      const result = await repository.countryExists("XX");

      expect(result).toBe(false);
    });
  });

  describe("getAllLocales", () => {
    it("should return unique locales sorted", async () => {
      const mockCountries: Partial<dir_country_locales>[] = [
        { id: "fr", supported_locales: ["fr", "en"] },
        { id: "ae", supported_locales: ["ar", "en"] },
        { id: "de", supported_locales: ["de", "en"] },
      ];

      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue(
        mockCountries as dir_country_locales[]
      );

      const result = await repository.getAllLocales();

      expect(result).toEqual(["ar", "de", "en", "fr"]);
    });

    it("should deduplicate locales", async () => {
      const mockCountries: Partial<dir_country_locales>[] = [
        { id: "fr", supported_locales: ["fr", "en"] },
        { id: "be", supported_locales: ["fr", "en", "nl"] },
      ];

      vi.mocked(mockPrisma.dir_country_locales.findMany).mockResolvedValue(
        mockCountries as dir_country_locales[]
      );

      const result = await repository.getAllLocales();

      expect(result).toEqual(["en", "fr", "nl"]);
      expect(result.filter((l: string) => l === "fr")).toHaveLength(1);
    });
  });
});
