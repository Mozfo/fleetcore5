import { z } from "zod";

// ========== COUNTRIES ==========

/**
 * Schema for countries query parameters
 * GET /api/v1/directory/countries
 */
export const listCountriesSchema = z.object({
  sortBy: z
    .enum(["country_code", "currency", "timezone"])
    .default("country_code"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ========== CAR MAKES ==========

/**
 * Schema for car makes query parameters
 * GET /api/v1/directory/makes
 */
export const listMakesSchema = z.object({
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(["name", "created_at"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Schema for creating a car make
 * POST /api/v1/directory/makes
 * V2: code is now required (NOT NULL in DB)
 */
export const createMakeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  code: z.string().min(1, "Code is required").max(50, "Code too long").trim(),
});

// ========== CAR MODELS ==========

/**
 * Schema for creating a car model
 * POST /api/v1/directory/models
 * V2: code is now required (NOT NULL in DB)
 */
export const createModelSchema = z.object({
  make_id: z.string().uuid("Invalid make ID format"),
  name: z
    .string()
    .min(1, "Model name is required")
    .max(100, "Model name too long")
    .trim(),
  code: z.string().min(1, "Code is required").max(50, "Code too long").trim(),
  vehicle_class_id: z.string().uuid("Invalid vehicle class ID").optional(),
});

// ========== PLATFORMS ==========

/**
 * Schema for platforms query parameters
 * GET /api/v1/directory/platforms
 */
export const listPlatformsSchema = z.object({
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(["name", "created_at"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Schema for creating a platform
 * POST /api/v1/directory/platforms
 * V2: code is now required (NOT NULL in DB)
 */
export const createPlatformSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  code: z.string().min(1, "Code is required").max(50, "Code too long").trim(),
  api_config: z.record(z.string(), z.unknown()).optional(),
});

// ========== REGULATIONS ==========

/**
 * Schema for regulations query parameters
 * GET /api/v1/directory/regulations
 */
export const listRegulationsSchema = z.object({
  country_code: z
    .string()
    .length(2, "Country code must be 2 characters")
    .toUpperCase()
    .optional(),
});

// ========== VEHICLE CLASSES ==========

/**
 * Schema for vehicle classes query parameters
 * GET /api/v1/directory/vehicle-classes
 */
export const listVehicleClassesSchema = z.object({
  country_code: z
    .string()
    .length(2, "Country code must be 2 characters")
    .toUpperCase()
    .optional(),
  search: z.string().min(1).max(100).optional(),
  sortBy: z.enum(["name", "created_at"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Schema for creating a vehicle class
 * POST /api/v1/directory/vehicle-classes
 * V2: code is now required (NOT NULL in DB)
 */
export const createVehicleClassSchema = z.object({
  country_code: z
    .string()
    .length(2, "Country code must be 2 characters")
    .toUpperCase(),
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  code: z.string().min(1, "Code is required").max(50, "Code too long").trim(),
  description: z.string().max(500, "Description too long").optional(),
  max_age: z
    .number()
    .int("Max age must be an integer")
    .positive("Max age must be positive")
    .optional(),
});

// ========== TYPE EXPORTS ==========

export type ListCountriesInput = z.infer<typeof listCountriesSchema>;
export type ListMakesInput = z.infer<typeof listMakesSchema>;
export type CreateMakeInput = z.infer<typeof createMakeSchema>;
export type CreateModelInput = z.infer<typeof createModelSchema>;
export type ListPlatformsInput = z.infer<typeof listPlatformsSchema>;
export type CreatePlatformInput = z.infer<typeof createPlatformSchema>;
export type ListRegulationsInput = z.infer<typeof listRegulationsSchema>;
export type ListVehicleClassesInput = z.infer<typeof listVehicleClassesSchema>;
export type CreateVehicleClassInput = z.infer<typeof createVehicleClassSchema>;
