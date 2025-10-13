import { z } from "zod";

// Schéma de création de conducteur
export const createDriverSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "First name required")
      .max(100, "First name too long")
      .trim(),
    last_name: z
      .string()
      .min(1, "Last name required")
      .max(100, "Last name too long")
      .trim(),
    email: z
      .string()
      .min(1, "Email required")
      .email("Invalid email format")
      .transform((val) => val.toLowerCase()),
    phone: z
      .string()
      .min(1, "Phone number required")
      .regex(
        /^\+[1-9]\d{1,14}$/,
        "Invalid phone format. Must be in E.164 format (e.g., +33612345678)"
      )
      .trim(),
    license_number: z
      .string()
      .min(1, "License number required")
      .max(50, "License number too long")
      .trim(),
    license_issue_date: z.coerce
      .date()
      .refine((val) => val <= new Date(), {
        message: "License issue date cannot be in the future",
      })
      .optional(),
    license_expiry_date: z.coerce
      .date()
      .refine((val) => val > new Date(), {
        message: "License expiry date must be in the future",
      })
      .optional(),
    // ========== UAE COMPLIANCE FIELDS ==========
    date_of_birth: z.coerce.date().refine((d) => d <= new Date(), {
      message: "Date of birth must be in the past",
    }),
    gender: z.enum(["male", "female", "unspecified"]),
    nationality: z
      .string()
      .length(2, { message: "ISO 3166-1 alpha-2 code required" })
      .regex(/^[A-Z]{2}$/, { message: "Must be uppercase 2-letter code" })
      .transform((val) => val.toUpperCase()),
    hire_date: z.coerce.date(),
    employment_status: z
      .enum(["active", "on_leave", "suspended", "terminated"])
      .default("active"),
    cooperation_type: z.enum([
      "employee",
      "contractor",
      "owner_operator",
      "partner_driver",
    ]),
    emergency_contact_name: z
      .string()
      .min(1, { message: "Emergency contact name required" })
      .max(100, { message: "Maximum 100 characters" }),
    emergency_contact_phone: z
      .string()
      .min(1, { message: "Emergency contact phone required" })
      .max(50, { message: "Maximum 50 characters" }),
    languages: z
      .array(
        z
          .string()
          .length(2, { message: "Language code must be 2 characters" })
          .regex(/^[A-Z]{2}$/, { message: "Must be uppercase ISO 639-1 code" })
          .transform((val) => val.toUpperCase())
      )
      .min(1, { message: "At least one language required" }),
    professional_card_no: z
      .string()
      .max(50, "Professional card number too long")
      .trim()
      .optional(),
    professional_expiry: z.coerce
      .date()
      .refine((val) => val > new Date(), {
        message: "Professional card expiry date must be in the future",
      })
      .optional(),
    notes: z.string().max(500, "Notes too long").trim().optional(),
  })
  .refine(
    (data) => {
      // Validate date coherence: if both license dates are provided, expiry must be after issue
      if (data.license_issue_date && data.license_expiry_date) {
        return data.license_expiry_date > data.license_issue_date;
      }
      return true;
    },
    {
      message: "License expiry date must be after issue date",
      path: ["license_expiry_date"],
    }
  );

// Schéma de mise à jour de conducteur
export const updateDriverSchema = createDriverSchema.partial().extend({
  driver_status: z.enum(["active", "suspended", "terminated"]).optional(),
  rating: z
    .number()
    .min(0, "Rating cannot be negative")
    .max(5, "Rating cannot exceed 5")
    .optional(),
});

/**
 * Schema for driver query parameters with filters and pagination
 * Used for GET /api/drivers endpoint
 */
export const driverQuerySchema = z
  .object({
    // Pagination
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),

    // Sorting
    sortBy: z
      .enum([
        "created_at",
        "last_name",
        "email",
        "rating",
        "driver_status",
        "employment_status",
      ])
      .default("created_at"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    // Status filter
    driver_status: z.enum(["active", "suspended", "terminated"]).optional(),

    // Cooperation type filter
    cooperation_type: z
      .enum(["employee", "contractor", "owner_operator", "partner_driver"])
      .optional(),

    // Rating range filter
    rating_min: z.coerce.number().min(0).max(5).optional(),
    rating_max: z.coerce.number().min(0).max(5).optional(),

    // Search filter (multi-field: first_name, last_name, email, phone)
    search: z.string().min(1).optional(),

    // Assignment filter
    has_active_assignment: z.coerce.boolean().optional(),

    // Document expiry filter (documents expiring within 30 days)
    expiring_documents: z.coerce.boolean().optional(),
  })
  .refine(
    (data) => {
      // Validate rating range coherence
      if (data.rating_min !== undefined && data.rating_max !== undefined) {
        return data.rating_min <= data.rating_max;
      }
      return true;
    },
    {
      message: "Minimum rating cannot be greater than maximum rating",
      path: ["rating_max"],
    }
  );

/**
 * Schema for driver suspension with mandatory reason
 * Used for POST /api/drivers/:id/suspend endpoint
 */
export const driverSuspensionSchema = z.object({
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason too long")
    .trim(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for driver document upload/update
 * Used for POST /api/drivers/:id/documents endpoint
 */
export const driverDocumentSchema = z
  .object({
    document_type: z.enum([
      "driver_license",
      "professional_card",
      "identity_document",
    ]),
    file_url: z.string().url("Invalid file URL"),
    issue_date: z.coerce
      .date()
      .refine((val) => val <= new Date(), {
        message: "Issue date cannot be in the future",
      })
      .optional(),
    expiry_date: z.coerce
      .date()
      .refine((val) => val > new Date(), {
        message: "Expiry date must be in the future",
      })
      .optional(),
    verified: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Validate date coherence: if both dates are provided, expiry must be after issue
      if (data.issue_date && data.expiry_date) {
        return data.expiry_date > data.issue_date;
      }
      return true;
    },
    {
      message: "Expiry date must be after issue date",
      path: ["expiry_date"],
    }
  );

/**
 * Schema for driver requests query parameters with filters and pagination
 * Used for GET /api/v1/drivers/:id/requests endpoint
 */
export const driverRequestsQuerySchema = z
  .object({
    // Pagination
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),

    // Sorting
    sort_by: z
      .enum(["created_at", "updated_at", "request_date", "status"])
      .default("created_at"),
    sort_order: z.enum(["asc", "desc"]).default("desc"),

    // Filters
    status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
    request_type: z.string().optional(),

    // Date range filters
    from_date: z.coerce.date().optional(),
    to_date: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      // Validate date range coherence
      if (data.from_date && data.to_date) {
        return data.from_date <= data.to_date;
      }
      return true;
    },
    {
      message: "from_date must be before or equal to to_date",
      path: ["to_date"],
    }
  );

/**
 * Schema for driver performance query parameters
 * Used for GET /api/v1/drivers/:id/performance endpoint
 */
export const driverPerformanceQuerySchema = z
  .object({
    // Date range filters
    from_date: z.coerce.date().optional(),
    to_date: z.coerce.date().optional(),

    // Platform filter (searches in metadata JSONB)
    platform: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate date range coherence
      if (data.from_date && data.to_date) {
        return data.from_date <= data.to_date;
      }
      return true;
    },
    {
      message: "from_date must be before or equal to to_date",
      path: ["to_date"],
    }
  );

// Export des types inférés
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type DriverQueryInput = z.infer<typeof driverQuerySchema>;
export type DriverSuspensionInput = z.infer<typeof driverSuspensionSchema>;
export type DriverDocumentInput = z.infer<typeof driverDocumentSchema>;
export type DriverRequestsQueryInput = z.infer<
  typeof driverRequestsQuerySchema
>;
export type DriverPerformanceQueryInput = z.infer<
  typeof driverPerformanceQuerySchema
>;
