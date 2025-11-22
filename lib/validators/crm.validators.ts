/**
 * CRM Validators - Zod Schemas for Lead, Opportunity, and Contract entities
 *
 * This module provides comprehensive validation for all CRM operations:
 * - Lead management (create, update, qualify, query)
 * - Opportunity management (create, update, query)
 * - Contract management (create, update, query)
 *
 * Best practices applied:
 * - PascalCase naming: {Entity}{Action}Schema
 * - Type inference with z.infer<>
 * - Query schemas with .coerce for pagination
 * - Cross-field validation with .refine()
 * - Custom error messages for user-facing errors
 *
 * @module lib/validators/crm.validators
 */

import { z } from "zod";
import { differenceInDays, differenceInYears } from "date-fns";

// ===== LEAD VALIDATORS =====

/**
 * Lead creation validation schema
 *
 * Validates all required fields for creating a new lead from demo request or manual entry.
 * Enforces strict validation rules for email, phone (E.164 format), names (no digits),
 * and GDPR compliance.
 *
 * @example
 * const validLead = {
 *   email: "john.doe@acme.com",
 *   phone: "+33612345678",
 *   first_name: "John",
 *   last_name: "Doe",
 *   fleet_size: 25,
 *   country_code: "FR",
 *   gdpr_consent: true
 * };
 * const result = LeadCreateSchema.parse(validLead);
 */
export const LeadCreateSchema = z
  .object({
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide")
      .max(255, "L'email ne peut pas dépasser 255 caractères"),

    phone: z
      .string()
      .min(1, "Le téléphone est requis")
      .regex(
        /^\+[1-9]\d{9,14}$/,
        "Format E.164 requis (ex: +33612345678). Le numéro doit contenir 10 à 15 chiffres."
      ),

    first_name: z
      .string()
      .min(1, "Le prénom est requis")
      .min(2, "Le prénom doit contenir au moins 2 caractères")
      .max(50, "Le prénom ne peut pas dépasser 50 caractères")
      .regex(/^[^0-9]*$/, "Le prénom ne doit pas contenir de chiffres"),

    last_name: z
      .string()
      .min(1, "Le nom est requis")
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom ne peut pas dépasser 50 caractères")
      .regex(/^[^0-9]*$/, "Le nom ne doit pas contenir de chiffres"),

    company_name: z
      .string()
      .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères")
      .max(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères")
      .trim()
      .optional(),

    fleet_size: z.enum(["1-10", "11-50", "51-100", "101-500", "500+"], {
      message:
        "Sélectionnez une taille de flotte valide (1-10, 11-50, 51-100, 101-500, 500+)",
    }),

    country_code: z
      .string()
      .min(1, "Le code pays est requis")
      .length(
        2,
        "Le code pays doit contenir exactement 2 caractères (ISO 3166-1)"
      )
      .transform((val) => val.toUpperCase()),

    form_locale: z
      .string()
      .min(2, "La locale doit contenir au moins 2 caractères")
      .max(5, "La locale ne peut pas dépasser 5 caractères")
      .regex(
        /^[a-z]{2}(-[A-Z]{2})?$/,
        "Format de locale invalide (ex: 'en', 'fr', 'zh-CN')"
      ),

    message: z
      .string()
      .max(1000, "Le message ne peut pas dépasser 1000 caractères")
      .optional(),

    utm_source: z
      .string()
      .max(50, "La source UTM ne peut pas dépasser 50 caractères")
      .optional(),

    utm_medium: z
      .string()
      .max(50, "Le medium UTM ne peut pas dépasser 50 caractères")
      .optional(),

    utm_campaign: z
      .string()
      .max(50, "La campagne UTM ne peut pas dépasser 50 caractères")
      .optional(),

    gdpr_consent: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const euCountries = [
        "FR",
        "DE",
        "IT",
        "ES",
        "NL",
        "BE",
        "AT",
        "PT",
        "GR",
        "IE",
        "FI",
        "SE",
        "DK",
        "PL",
        "CZ",
        "RO",
        "BG",
        "HR",
        "SK",
        "SI",
        "LT",
        "LV",
        "EE",
        "CY",
        "LU",
        "MT",
        "HU",
      ];
      if (euCountries.includes(data.country_code)) {
        return data.gdpr_consent === true;
      }
      return true;
    },
    {
      message:
        "Le consentement RGPD est obligatoire pour les pays de l'Union Européenne",
      path: ["gdpr_consent"],
    }
  );

export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;

/**
 * Lead update validation schema
 *
 * All fields optional for partial updates. Reuses LeadCreateSchema validation rules.
 *
 * @example
 * const update = { fleet_size: 30, gdpr_consent: true };
 * const result = LeadUpdateSchema.parse(update);
 */
export const LeadUpdateSchema = LeadCreateSchema.partial();

export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>;

/**
 * Lead qualification validation schema
 *
 * Used when a commercial qualifies a lead with scoring and stage transition.
 *
 * @example
 * const qualification = {
 *   lead_stage: "sales_qualified",
 *   qualification_score: 85,
 *   qualification_notes: "Strong fit, budget confirmed"
 * };
 */
export const LeadQualifySchema = z.object({
  lead_stage: z
    .enum(["sales_qualified", "marketing_qualified"])
    .describe(
      "Le statut de qualification doit être 'sales_qualified' ou 'marketing_qualified'"
    ),

  qualification_score: z
    .number()
    .min(0, "Le score doit être entre 0 et 100")
    .max(100, "Le score doit être entre 0 et 100"),

  qualification_notes: z
    .string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional(),
});

export type LeadQualifyInput = z.infer<typeof LeadQualifySchema>;

/**
 * Lead query/filter validation schema
 *
 * Validates GET /api/v1/crm/leads query parameters for searching, filtering,
 * sorting, and paginating leads. Uses .coerce for automatic type conversion
 * from query strings.
 *
 * @example
 * // Query: ?page=2&limit=50&status=qualified&search=acme
 * const filters = LeadQuerySchema.parse(req.query);
 * // Result: { page: 2, limit: 50, status: "qualified", search: "acme", ... }
 */
export const LeadQuerySchema = z.object({
  // Pagination
  page: z.coerce
    .number()
    .int("La page doit être un nombre entier")
    .min(1, "La page doit être >= 1")
    .default(1),

  limit: z.coerce
    .number()
    .int("La limite doit être un nombre entier")
    .min(1, "La limite doit être >= 1")
    .max(100, "La limite ne peut pas dépasser 100")
    .default(20),

  // Sorting
  sortBy: z
    .enum(["created_at", "email", "company_name", "fit_score"])
    .describe(
      "Le tri doit être par: created_at, email, company_name, ou fit_score"
    )
    .default("created_at"),

  sortOrder: z
    .enum(["asc", "desc"])
    .describe("L'ordre doit être 'asc' ou 'desc'")
    .default("desc"),

  // Filters
  status: z
    .enum(["new", "working", "qualified", "converted", "lost"])
    .describe(
      "Le statut doit être: new, working, qualified, converted, ou lost"
    )
    .optional(),

  lead_stage: z
    .enum([
      "top_of_funnel",
      "marketing_qualified",
      "sales_qualified",
      "opportunity",
    ])
    .describe(
      "Le stage doit être: top_of_funnel, marketing_qualified, sales_qualified, ou opportunity"
    )
    .optional(),

  country_code: z
    .string()
    .length(2, "Le code pays doit contenir 2 caractères")
    .transform((val) => val.toUpperCase())
    .optional(),

  assigned_to: z
    .string()
    .uuid("L'ID de l'assigné doit être un UUID valide")
    .optional(),

  source_id: z
    .string()
    .uuid("L'ID de la source doit être un UUID valide")
    .optional(),

  // Text search
  search: z
    .string()
    .min(2, "La recherche doit contenir au moins 2 caractères")
    .max(100, "La recherche ne peut pas dépasser 100 caractères")
    .optional(),

  // Date range filters
  created_after: z.coerce.date().optional(),
  created_before: z.coerce.date().optional(),
});

export type LeadQueryInput = z.infer<typeof LeadQuerySchema>;

// ===== OPPORTUNITY VALIDATORS =====

/**
 * Opportunity creation validation schema
 *
 * Validates creation of sales opportunities from qualified leads.
 * Enforces business rules for expected close date (max 2 years) and currency format.
 *
 * @example
 * const opportunity = {
 *   lead_id: "123e4567-e89b-12d3-a456-426614174000",
 *   stage: "proposal",
 *   status: "open",
 *   expected_value: 50000,
 *   probability_percent: 60,
 *   expected_close_date: new Date("2025-06-01"),
 *   currency: "EUR"
 * };
 */
export const OpportunityCreateSchema = z.object({
  lead_id: z
    .string()
    .min(1, "L'ID du lead est requis")
    .uuid("L'ID du lead doit être un UUID valide"),

  stage: z
    .enum([
      "prospecting",
      "qualification",
      "proposal",
      "negotiation",
      "closing",
    ])
    .describe(
      "Le stage doit être: prospecting, qualification, proposal, negotiation, ou closing"
    ),

  status: z
    .enum(["open", "won", "lost"])
    .describe("Le statut doit être: open, won, ou lost"),

  expected_value: z
    .number()
    .positive("La valeur attendue doit être un nombre positif"),

  probability_percent: z
    .number()
    .min(0, "La probabilité doit être entre 0 et 100")
    .max(100, "La probabilité doit être entre 0 et 100"),

  expected_close_date: z.coerce
    .date()
    .refine((date) => date >= new Date(), {
      message: "La date de clôture doit être dans le futur",
    })
    .refine((date) => differenceInYears(date, new Date()) <= 2, {
      message: "La date de clôture ne peut pas dépasser 2 ans dans le futur",
    }),

  currency: z
    .string()
    .min(1, "La devise est requise")
    .length(
      3,
      "La devise doit être un code ISO 4217 de 3 lettres (ex: EUR, USD)"
    )
    .transform((val) => val.toUpperCase()),
});

export type OpportunityCreateInput = z.infer<typeof OpportunityCreateSchema>;

/**
 * Opportunity update validation schema
 *
 * All fields optional for partial updates.
 */
export const OpportunityUpdateSchema = OpportunityCreateSchema.partial();

export type OpportunityUpdateInput = z.infer<typeof OpportunityUpdateSchema>;

/**
 * Opportunity query/filter validation schema
 *
 * Validates GET /api/v1/crm/opportunities query parameters.
 *
 * @example
 * // Query: ?stage=proposal&status=open&min_value=10000
 */
export const OpportunityQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z
    .enum(["created_at", "expected_close_date", "expected_value"])
    .describe(
      "Le tri doit être par: created_at, expected_close_date, ou expected_value"
    )
    .default("created_at"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Filters
  stage: z
    .enum([
      "prospecting",
      "qualification",
      "proposal",
      "negotiation",
      "closing",
    ])
    .optional(),

  status: z.enum(["open", "won", "lost", "on_hold", "cancelled"]).optional(),

  pipeline_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),

  // Value range filters
  min_value: z.coerce.number().positive().optional(),
  max_value: z.coerce.number().positive().optional(),

  // Date range filters
  close_date_after: z.coerce.date().optional(),
  close_date_before: z.coerce.date().optional(),
});

export type OpportunityQueryInput = z.infer<typeof OpportunityQuerySchema>;

// ===== CONTRACT VALIDATORS =====

/**
 * Contract creation validation schema
 *
 * Validates contract creation with cross-field validation for dates and duration.
 * Enforces minimum contract duration (30 days) and logical date ordering.
 *
 * @example
 * const contract = {
 *   opportunity_id: "123e4567-e89b-12d3-a456-426614174000",
 *   start_date: new Date("2025-01-01"),
 *   end_date: new Date("2026-01-01"),
 *   total_value: 60000,
 *   billing_cycle: "monthly",
 *   auto_renew: true
 * };
 */
export const ContractCreateSchema = z
  .object({
    opportunity_id: z
      .string()
      .min(1, "L'ID de l'opportunité est requis")
      .uuid("L'ID de l'opportunité doit être un UUID valide"),

    start_date: z.coerce.date().refine((date) => date >= new Date(), {
      message: "La date de début doit être égale ou postérieure à aujourd'hui",
    }),

    end_date: z.coerce.date(),

    total_value: z
      .number()
      .positive("La valeur totale doit être un nombre positif")
      .min(100, "La valeur totale doit être d'au moins 100"),

    billing_cycle: z
      .enum(["monthly", "quarterly", "yearly"])
      .describe(
        "Le cycle de facturation doit être: monthly, quarterly, ou yearly"
      ),

    auto_renew: z.boolean(),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["end_date"],
  })
  .refine((data) => differenceInDays(data.end_date, data.start_date) >= 30, {
    message: "Le contrat doit avoir une durée minimale de 30 jours",
    path: ["end_date"],
  });

export type ContractCreateInput = z.infer<typeof ContractCreateSchema>;

/**
 * Contract update validation schema
 *
 * All fields optional for partial updates.
 */
export const ContractUpdateSchema = ContractCreateSchema.partial();

export type ContractUpdateInput = z.infer<typeof ContractUpdateSchema>;

/**
 * Contract query/filter validation schema
 *
 * Validates GET /api/v1/crm/contracts query parameters.
 *
 * @example
 * // Query: ?status=active&billing_cycle=monthly&renewal_date_within_days=30
 */
export const ContractQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Sorting
  sortBy: z
    .enum(["created_at", "start_date", "end_date", "total_value"])
    .describe(
      "Le tri doit être par: created_at, start_date, end_date, ou total_value"
    )
    .default("created_at"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),

  // Filters
  status: z
    .enum([
      "draft",
      "negotiation",
      "signed",
      "active",
      "future",
      "expired",
      "terminated",
      "renewal_in_progress",
      "cancelled",
    ])
    .optional(),

  billing_cycle: z.enum(["monthly", "quarterly", "yearly"]).optional(),

  auto_renew: z.coerce.boolean().optional(),

  tenant_id: z.string().uuid().optional(),

  // Date range filters
  start_date_after: z.coerce.date().optional(),
  end_date_before: z.coerce.date().optional(),

  // Renewal alert filter (find contracts expiring soon)
  renewal_date_within_days: z.coerce
    .number()
    .int()
    .min(1, "Le nombre de jours doit être >= 1")
    .max(365, "Le nombre de jours ne peut pas dépasser 365")
    .optional(),
});

export type ContractQueryInput = z.infer<typeof ContractQuerySchema>;
