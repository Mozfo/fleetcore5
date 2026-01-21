/**
 * CountryService Unit Tests
 *
 * Tests for country-related business logic including:
 * - GDPR compliance checks (EU/EEA countries)
 * - Operational status checks (FleetCore availability)
 * - Country details retrieval
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CountryService } from "../country.service";
import { CountryRepository } from "@/lib/repositories/crm/country.repository";
import { NotFoundError } from "@/lib/core/errors";
import type { crm_countries } from "@prisma/client";

// Mock CountryRepository
vi.mock("@/lib/repositories/crm/country.repository");

describe("CountryService", () => {
  let countryService: CountryService;
  let mockCountryRepository: {
    isGdprCountry: ReturnType<typeof vi.fn>;
    isOperationalCountry: ReturnType<typeof vi.fn>;
    findByCode: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create service instance
    countryService = new CountryService();

    // Get mock repository instance and setup methods
    const repoInstance = vi.mocked(CountryRepository).mock.instances[0];
    mockCountryRepository = {
      isGdprCountry: vi.fn(),
      isOperationalCountry: vi.fn(),
      findByCode: vi.fn(),
    };

    // Assign mocks to repository instance
    Object.assign(repoInstance, mockCountryRepository);
  });

  describe("isGdprCountry", () => {
    it("should return true for EU country (France)", async () => {
      // Arrange
      mockCountryRepository.isGdprCountry.mockResolvedValue(true);

      // Act
      const result = await countryService.isGdprCountry("FR");

      // Assert
      expect(result).toBe(true);
      expect(mockCountryRepository.isGdprCountry).toHaveBeenCalledWith("FR");
    });

    it("should return true for EEA country (Norway)", async () => {
      // Arrange
      mockCountryRepository.isGdprCountry.mockResolvedValue(true);

      // Act
      const result = await countryService.isGdprCountry("NO");

      // Assert
      expect(result).toBe(true);
      expect(mockCountryRepository.isGdprCountry).toHaveBeenCalledWith("NO");
    });

    it("should return false for non-EU country (UAE)", async () => {
      // Arrange
      mockCountryRepository.isGdprCountry.mockResolvedValue(false);

      // Act
      const result = await countryService.isGdprCountry("AE");

      // Assert
      expect(result).toBe(false);
      expect(mockCountryRepository.isGdprCountry).toHaveBeenCalledWith("AE");
    });

    it("should return false for unknown country (safe default)", async () => {
      // Arrange
      mockCountryRepository.isGdprCountry.mockResolvedValue(false);

      // Act
      const result = await countryService.isGdprCountry("XX");

      // Assert
      expect(result).toBe(false);
      expect(mockCountryRepository.isGdprCountry).toHaveBeenCalledWith("XX");
    });
  });

  describe("isOperational", () => {
    it("should return true for operational country (UAE)", async () => {
      // Arrange
      mockCountryRepository.isOperationalCountry.mockResolvedValue(true);

      // Act
      const result = await countryService.isOperational("AE");

      // Assert
      expect(result).toBe(true);
      expect(mockCountryRepository.isOperationalCountry).toHaveBeenCalledWith(
        "AE"
      );
    });

    it("should return true for operational EU country (France)", async () => {
      // Arrange
      mockCountryRepository.isOperationalCountry.mockResolvedValue(true);

      // Act
      const result = await countryService.isOperational("FR");

      // Assert
      expect(result).toBe(true);
      expect(mockCountryRepository.isOperationalCountry).toHaveBeenCalledWith(
        "FR"
      );
    });

    it("should return false for non-operational country (Brazil)", async () => {
      // Arrange
      mockCountryRepository.isOperationalCountry.mockResolvedValue(false);

      // Act
      const result = await countryService.isOperational("BR");

      // Assert
      expect(result).toBe(false);
      expect(mockCountryRepository.isOperationalCountry).toHaveBeenCalledWith(
        "BR"
      );
    });
  });

  describe("getCountryDetails", () => {
    it("should return complete country details", async () => {
      // Arrange
      const mockCountry: crm_countries = {
        id: "country-id-123",
        country_code: "FR",
        country_name_en: "France",
        country_name_fr: "France",
        country_name_ar: "فرنسا",
        flag_emoji: "🇫🇷",
        is_operational: true,
        country_gdpr: true,
        phone_prefix: "+33",
        phone_example: "6 12 34 56 78",
        phone_min_digits: 9,
        phone_max_digits: 9,
        notification_locale: "fr",
        country_preposition_en: "in",
        country_preposition_fr: "en",
        is_visible: true,
        display_order: 2,
        is_system: false,
        provider_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCountryRepository.findByCode.mockResolvedValue(mockCountry);

      // Act
      const result = await countryService.getCountryDetails("FR");

      // Assert
      expect(result).toEqual(mockCountry);
      expect(result.country_code).toBe("FR");
      expect(result.country_gdpr).toBe(true);
      expect(result.is_operational).toBe(true);
      expect(mockCountryRepository.findByCode).toHaveBeenCalledWith("FR");
    });

    it("should throw NotFoundError for unknown country", async () => {
      // Arrange
      mockCountryRepository.findByCode.mockResolvedValue(null);

      // Act & Assert
      await expect(countryService.getCountryDetails("XX")).rejects.toThrow(
        NotFoundError
      );
      await expect(countryService.getCountryDetails("XX")).rejects.toThrow(
        "Country with code 'XX' not found in database"
      );
      expect(mockCountryRepository.findByCode).toHaveBeenCalledWith("XX");
    });
  });
});
