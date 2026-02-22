/**
 * Administration Validators - Zod Schemas for Tenant, Member, and Role management
 *
 * This module provides comprehensive validation for all Administration operations:
 * - Tenant management (create, update, query)
 * - Member management (invite, update, query)
 * - Role management (create, update, query with RBAC permissions)
 *
 * Best practices applied:
 * - PascalCase naming: {Entity}{Action}Schema
 * - Type inference with z.infer<>
 * - Query schemas with .coerce for pagination
 * - Granular CRUD permissions validation
 * - Custom error messages for user-facing errors
 *
 * @module lib/validators/admin.validators
 */

import { z } from "zod";

// ===== TENANT VALIDATORS =====

/**
 * Tenant creation validation schema
 *
 * Validates all required fields for creating a new tenant (organization).
 * Enforces strict validation for slug (kebab-case), auth org ID format,
 * and resource limits (max members, max vehicles).
 *
 * @example
 * const tenant = {
 *   name: "Acme Logistics",
 *   slug: "acme-logistics",
 *   auth_organization_id: "550e8400-e29b-41d4-a716-446655440000",
 *   country_code: "FR",
 *   default_currency: "EUR",
 *   timezone: "Europe/Paris",
 *   max_members: 50,
 *   max_vehicles: 200
 * };
 */
export const TenantCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du tenant est requis")
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  slug: z
    .string()
    .min(1, "Le slug est requis")
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug doit être en format kebab-case (ex: acme-logistics)"
    )
    .min(3, "Le slug doit contenir au moins 3 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères"),

  auth_organization_id: z
    .string()
    .uuid("L'ID de l'organisation doit être un UUID valide")
    .optional(),

  country_code: z
    .string()
    .min(1, "Le code pays est requis")
    .length(
      2,
      "Le code pays doit contenir exactement 2 caractères (ISO 3166-1)"
    )
    .transform((val) => val.toUpperCase()),

  default_currency: z
    .string()
    .min(1, "La devise par défaut est requise")
    .length(
      3,
      "La devise doit être un code ISO 4217 de 3 lettres (ex: EUR, USD)"
    )
    .transform((val) => val.toUpperCase()),

  timezone: z
    .string()
    .min(1, "Le fuseau horaire est requis")
    .min(3, "Le fuseau horaire est invalide (ex: Europe/Paris, UTC)"),

  max_members: z
    .number()
    .int("Le nombre maximum de membres doit être un entier")
    .min(1, "Le tenant doit permettre au moins 1 membre")
    .max(1000, "Le nombre maximum de membres ne peut pas dépasser 1000"),

  max_vehicles: z
    .number()
    .int("Le nombre maximum de véhicules doit être un entier")
    .min(1, "Le tenant doit permettre au moins 1 véhicule")
    .max(10000, "Le nombre maximum de véhicules ne peut pas dépasser 10 000"),
});

export type TenantCreateInput = z.infer<typeof TenantCreateSchema>;

/**
 * Tenant update validation schema
 *
 * All fields optional for partial updates.
 *
 * @example
 * const update = { max_members: 100, max_vehicles: 500 };
 */
export const TenantUpdateSchema = TenantCreateSchema.partial();

export type TenantUpdateInput = z.infer<typeof TenantUpdateSchema>;

// ===== MEMBER VALIDATORS =====

/**
 * Member invitation validation schema
 *
 * Validates member invitation fields. Used when a provider employee or admin
 * invites a new user to join a tenant.
 *
 * @example
 * const invitation = {
 *   email: "john.doe@acme.com",
 *   role_id: "123e4567-e89b-12d3-a456-426614174000",
 *   invitation_type: "additional_user",
 *   custom_message: "Welcome to the team!"
 * };
 */
export const MemberInviteSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Format d'email invalide")
    .max(255, "L'email ne peut pas dépasser 255 caractères"),

  role_id: z
    .string()
    .min(1, "L'ID du rôle est requis")
    .uuid("L'ID du rôle doit être un UUID valide"),

  custom_message: z
    .string()
    .max(500, "Le message personnalisé ne peut pas dépasser 500 caractères")
    .optional(),

  invitation_type: z
    .enum(["initial_admin", "additional_user"])
    .describe(
      "Le type d'invitation doit être 'initial_admin' ou 'additional_user'"
    ),
});

export type MemberInviteInput = z.infer<typeof MemberInviteSchema>;

/**
 * Member update validation schema
 *
 * Validates member profile updates (names, language, notification preferences).
 *
 * @example
 * const update = {
 *   first_name: "John",
 *   last_name: "Doe",
 *   preferred_language: "fr",
 *   notification_preferences: {
 *     email_enabled: true,
 *     sms_enabled: false,
 *     push_enabled: true
 *   }
 * };
 */
export const MemberUpdateSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .optional(),

  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .optional(),

  preferred_language: z
    .enum(["en", "fr", "ar"])
    .describe("La langue doit être: en (anglais), fr (français), ou ar (arabe)")
    .optional(),

  notification_preferences: z
    .object({
      email_enabled: z.boolean(),
      sms_enabled: z.boolean(),
      push_enabled: z.boolean(),
    })
    .optional(),
});

export type MemberUpdateInput = z.infer<typeof MemberUpdateSchema>;

/**
 * Member query/filter validation schema
 *
 * Validates GET /api/v1/admin/members query parameters.
 *
 * @example
 * // Query: ?status=active&role_id=123&two_factor_enabled=true
 */
export const MemberQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z
    .enum(["created_at", "email", "last_name"])
    .describe("Le tri doit être par: created_at, email, ou last_name")
    .default("created_at"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Filters
  status: z
    .enum(["invited", "active", "suspended", "terminated"])
    .describe("Le statut doit être: invited, active, suspended, ou terminated")
    .optional(),

  role_id: z.string().uuid("L'ID du rôle doit être un UUID valide").optional(),

  team_id: z
    .string()
    .uuid("L'ID de l'équipe doit être un UUID valide")
    .optional(),

  two_factor_enabled: z.coerce.boolean().optional(),

  // Text search (email, first_name, last_name)
  search: z
    .string()
    .min(2, "La recherche doit contenir au moins 2 caractères")
    .max(100, "La recherche ne peut pas dépasser 100 caractères")
    .optional(),
});

export type MemberQueryInput = z.infer<typeof MemberQuerySchema>;

// ===== ROLE VALIDATORS =====

/**
 * Permission CRUD schema
 *
 * Defines granular create, read, update, delete permissions for a resource.
 *
 * @example
 * const permissions = { create: true, read: true, update: true, delete: false };
 */
const PermissionCRUDSchema = z.object({
  create: z.boolean(),
  read: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
});

/**
 * Role creation validation schema
 *
 * Validates role creation with granular CRUD permissions for each resource type.
 * Supports system roles (non-modifiable), maximum member limits, and hierarchical permissions.
 *
 * @example
 * const role = {
 *   name: "Fleet Manager",
 *   description: "Can manage vehicles and drivers",
 *   permissions: {
 *     vehicles: { create: true, read: true, update: true, delete: false },
 *     drivers: { create: true, read: true, update: true, delete: false },
 *     trips: { create: false, read: true, update: false, delete: false },
 *     leads: { create: false, read: false, update: false, delete: false },
 *     opportunities: { create: false, read: false, update: false, delete: false },
 *     contracts: { create: false, read: false, update: false, delete: false }
 *   },
 *   is_system: false,
 *   max_members: 10
 * };
 */
export const RoleCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du rôle est requis")
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),

  description: z
    .string()
    .min(1, "La description est requise")
    .max(500, "La description ne peut pas dépasser 500 caractères"),

  permissions: z.object({
    vehicles: PermissionCRUDSchema,
    drivers: PermissionCRUDSchema,
    trips: PermissionCRUDSchema,
    leads: PermissionCRUDSchema,
    opportunities: PermissionCRUDSchema,
    contracts: PermissionCRUDSchema,
  }),

  is_system: z.boolean().default(false),

  max_members: z
    .number()
    .int("Le nombre maximum de membres doit être un entier")
    .positive("Le nombre maximum de membres doit être positif")
    .optional(),
});

export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;

/**
 * Role update validation schema
 *
 * All fields optional for partial updates.
 * Note: is_system roles cannot be modified via API (enforced at service layer).
 */
export const RoleUpdateSchema = RoleCreateSchema.partial();

export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;

/**
 * Role query/filter validation schema
 *
 * Validates GET /api/v1/admin/roles query parameters.
 *
 * @example
 * // Query: ?is_system=false&status=active&search=manager
 */
export const RoleQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z
    .enum(["created_at", "name"])
    .describe("Le tri doit être par: created_at ou name")
    .default("name"),

  sortOrder: z.enum(["asc", "desc"]).default("asc"),

  // Filters
  status: z
    .enum(["active", "inactive"])
    .describe("Le statut doit être: active ou inactive")
    .optional(),

  is_system: z.coerce.boolean().optional(),

  is_default: z.coerce.boolean().optional(),

  // Text search (name, description)
  search: z
    .string()
    .min(2, "La recherche doit contenir au moins 2 caractères")
    .max(100, "La recherche ne peut pas dépasser 100 caractères")
    .optional(),
});

export type RoleQueryInput = z.infer<typeof RoleQuerySchema>;
