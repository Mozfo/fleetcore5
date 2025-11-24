/**
 * Lead Validators - Zod Schemas for API v1 Lead Operations
 *
 * This module provides validation for API v1 lead management:
 * - Lead creation with automatic scoring and assignment
 * - Response schemas for success and error cases
 *
 * Note: This is separate from the public demo form validators in crm.validators.ts
 * which have different requirements (GDPR consent, first_name/last_name split, etc.)
 *
 * @module lib/validators/crm/lead.validators
 */

import { z } from "zod";

/**
 * Lead creation request validation for API v1
 *
 * Validates lead data for POST /api/v1/crm/leads endpoint.
 * This schema is for internal API use with automatic scoring and assignment.
 *
 * Key differences from public demo form:
 * - Uses contact_name (single field) instead of first_name/last_name
 * - Phone is optional (not all leads provide phone upfront)
 * - Message can be longer (5000 chars for detailed descriptions)
 * - Includes UTM tracking parameters
 * - Includes flexible metadata for page_views, time_on_site, etc.
 * - No GDPR consent field (handled at form level)
 *
 * @example
 * const lead = {
 *   email: "ceo@bigfleet.ae",
 *   company_name: "Big Fleet Corp",
 *   contact_name: "John Doe",
 *   phone: "+971501234567",
 *   fleet_size: "500+",
 *   country_code: "AE",
 *   message: "We need fleet management for 600 vehicles...",
 *   source: "website",
 *   metadata: { page_views: 12, time_on_site: 720 }
 * };
 * const validated = CreateLeadSchema.parse(lead);
 */
export const CreateLeadSchema = z.object({
  // Required fields
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .trim()
    .max(255, "Email too long"),

  // Optional contact info
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name too long")
    .trim()
    .optional()
    .nullable(),

  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[^0-9]*$/, "Le prénom ne peut pas contenir de chiffres")
    .trim(),

  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[^0-9]*$/, "Le nom ne peut pas contenir de chiffres")
    .trim(),

  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Invalid phone format (E.164 expected, e.g., +33612345678)"
    )
    .optional()
    .nullable(),

  // Business context
  fleet_size: z
    .enum(["1-10", "11-50", "51-100", "101-500", "500+"])
    .optional()
    .nullable(),

  country_code: z
    .string()
    .length(2, "Country code must be ISO 3166-1 alpha-2 (2 chars)")
    .toUpperCase()
    .optional()
    .nullable(),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message too long")
    .trim()
    .optional()
    .nullable(),

  // Lead source tracking
  source: z
    .enum([
      "website",
      "referral",
      "paid_ad",
      "social_media",
      "event",
      "cold_outreach",
      "partner",
      "other",
    ])
    .default("website"),

  source_details: z
    .string()
    .max(200, "Source details too long")
    .optional()
    .nullable(),

  // UTM parameters
  utm_source: z.string().max(255, "UTM source too long").optional().nullable(),
  utm_medium: z.string().max(255, "UTM medium too long").optional().nullable(),
  utm_campaign: z
    .string()
    .max(255, "UTM campaign too long")
    .optional()
    .nullable(),

  // GDPR fields (required for EU/EEA countries only)
  gdpr_consent: z.boolean().optional().nullable(),
  consent_ip: z
    .string()
    .max(45, "IP address too long (IPv4 or IPv6)")
    .optional()
    .nullable(),

  // Metadata (flexible JSON)
  metadata: z
    .object({
      page_views: z.number().int().min(0).optional(),
      time_on_site: z.number().int().min(0).optional(),
      referrer_url: z.string().url().optional(),
      landing_page: z.string().url().optional(),
      ip_address: z.string().optional(), // String validation instead of .ip()
    })
    .passthrough() // Allow additional fields for extensibility
    .optional()
    .nullable(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

/**
 * Lead creation response schema
 *
 * Validates successful response from POST /api/v1/crm/leads.
 * Includes lead data, scoring information, and assignment details.
 *
 * @example
 * const response = {
 *   success: true,
 *   data: {
 *     id: "uuid",
 *     lead_code: "LEAD-2025-001",
 *     email: "ceo@bigfleet.ae",
 *     status: "new",
 *     priority: "high",
 *     fit_score: 60,
 *     engagement_score: 100,
 *     qualification_score: 76,
 *     lead_stage: "sales_qualified",
 *     assigned_to: "emp-uuid",
 *     assignment_reason: "Fleet size priority: 500+",
 *     created_at: "2025-01-15T10:30:00.000Z"
 *   },
 *   message: "Lead created successfully"
 * };
 */
export const LeadCreationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string().uuid(),
    lead_code: z.string(),
    email: z.string().email(),
    status: z.enum([
      "new",
      "contacted",
      "qualified",
      "disqualified",
      "converted",
    ]),
    priority: z.enum(["low", "medium", "high", "urgent"]),

    // Scoring info
    fit_score: z.number().int().min(0).max(100),
    engagement_score: z.number().int().min(0).max(100),
    qualification_score: z.number().int().min(0).max(100),
    lead_stage: z.enum([
      "top_of_funnel",
      "marketing_qualified",
      "sales_qualified",
    ]),

    // Assignment info
    assigned_to: z.string().uuid().nullable(),
    assignment_reason: z.string().optional(),

    created_at: z.string().datetime(),
  }),
  message: z.string(),
});

export type LeadCreationResponse = z.infer<typeof LeadCreationResponseSchema>;

/**
 * Error response schema
 *
 * Validates error responses from API endpoints.
 * Includes error code, message, and optional details.
 *
 * @example
 * const errorResponse = {
 *   success: false,
 *   error: {
 *     code: "VALIDATION_ERROR",
 *     message: "Invalid input data",
 *     details: [{ field: "email", message: "Invalid email format" }]
 *   }
 * };
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Lead update schema for PATCH /api/v1/crm/leads/[id]
 *
 * Validates partial updates to existing leads.
 * Only includes fields that are allowed to be updated.
 *
 * Fields NOT allowed to update:
 * - id, lead_code (immutable)
 * - email (identity field, cannot change)
 * - fit_score, engagement_score, qualification_score (auto-calculated)
 * - created_at, created_by (audit trail)
 * - deleted_at, deleted_by (managed by DELETE endpoint)
 *
 * @example
 * const update = {
 *   first_name: "John",
 *   status: "working",
 *   notes: "Called customer, very interested"
 * };
 * const validated = UpdateLeadSchema.parse(update);
 */
export const UpdateLeadSchema = z.object({
  // Contact info
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name too long")
    .regex(/^[^0-9]*$/, "First name cannot contain digits")
    .trim()
    .optional(),

  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name too long")
    .regex(/^[^0-9]*$/, "Last name cannot contain digits")
    .trim()
    .optional(),

  phone: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Invalid phone format (E.164 expected, e.g., +33612345678)"
    )
    .nullable()
    .optional(),

  // Business context
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(200, "Company name too long")
    .trim()
    .optional(),

  fleet_size: z.enum(["1-10", "11-50", "51-100", "101-500", "500+"]).optional(),

  country_code: z
    .string()
    .length(2, "Country code must be ISO 3166-1 alpha-2 (2 chars)")
    .toUpperCase()
    .optional(),

  message: z
    .string()
    .max(5000, "Message too long")
    .trim()
    .nullable()
    .optional(),

  // Lead management - CORRECT ENUMS (working not contacted, no converted)
  status: z
    .enum(["new", "working", "qualified", "lost"])
    .describe(
      "Status must be: new, working, qualified, or lost. Use POST /leads/[id]/convert for converted status."
    )
    .optional(),

  lead_stage: z
    .enum(["top_of_funnel", "marketing_qualified", "sales_qualified"])
    .describe("Lead stage based on qualification score")
    .optional(),

  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),

  assigned_to: z.string().uuid("Invalid employee UUID").nullable().optional(),

  // Notes
  notes: z.string().max(10000, "Notes too long").nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
