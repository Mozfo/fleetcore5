import { z } from "zod";

// Année courante pour validation
const currentYear = new Date().getFullYear();

// Schéma de création de véhicule
export const createVehicleSchema = z.object({
  make_id: z.string().uuid("Invalid make ID"),
  model_id: z.string().uuid("Invalid model ID"),
  license_plate: z
    .string()
    .min(1, "License plate required")
    .max(20, "License plate too long")
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9\-\s]+$/.test(val), {
      message: "License plate contains invalid characters",
    }),
  vin: z
    .string()
    .length(17, "VIN must be exactly 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "Invalid VIN format (I, O, Q not allowed)")
    .transform((val) => val.toUpperCase())
    .optional(),
  year: z
    .number()
    .int("Year must be an integer")
    .min(1900, "Invalid year")
    .max(currentYear + 1, `Year cannot be after ${currentYear + 1}`),
  color: z.string().min(1).max(50).optional(),
  seats: z
    .number()
    .int("Seats must be an integer")
    .min(2, "Minimum 2 seats required")
    .max(50, "Maximum 50 seats allowed"),
  vehicle_class: z.string().min(1).max(50).optional(),
  fuel_type: z
    .enum([
      "petrol",
      "diesel",
      "hybrid",
      "electric",
      "lng",
      "cng",
      "lpg",
      "hydrogen",
    ])
    .optional(),
  transmission: z
    .enum(["manual", "automatic", "semi-automatic", "cvt", "dct"])
    .optional(),
  registration_date: z.coerce
    .date()
    .refine((val) => val <= new Date(), {
      message: "Registration date cannot be in the future",
    })
    .optional(),
  insurance_number: z.string().min(1).max(100).optional(),
  insurance_expiry: z.coerce
    .date()
    .refine((val) => val >= new Date(), {
      message: "Insurance expiry date must be in the future",
    })
    .optional(),
  last_inspection: z.coerce
    .date()
    .refine((val) => val <= new Date(), {
      message: "Last inspection date cannot be in the future",
    })
    .optional(),
  next_inspection: z.coerce.date().optional(),
  odometer: z
    .number()
    .int("Odometer must be an integer")
    .min(0, "Odometer cannot be negative")
    .max(9999999, "Odometer value too high")
    .optional(),
  ownership_type: z
    .enum(["owned", "leased", "rented", "investor", "partner"])
    .default("owned"),
  country_code: z
    .string()
    .length(2, "Country code must be exactly 2 characters")
    .regex(/^[A-Z]{2}$/, "Country code must be 2 uppercase letters")
    .transform((val) => val.toUpperCase()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Schéma de mise à jour de véhicule
export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z
    .enum(["active", "inactive", "maintenance", "retired", "sold"])
    .optional(),
});

// Schéma d'assignation de véhicule
export const vehicleAssignmentSchema = z
  .object({
    driver_id: z.string().uuid("Invalid driver ID"),
    start_date: z.coerce.date(),
    end_date: z.coerce.date().optional(),
    assignment_type: z
      .enum(["permanent", "temporary", "substitute", "training"])
      .default("permanent"),
    notes: z.string().max(500, "Notes too long").optional(),
  })
  .refine(
    (data) => {
      if (data.end_date) {
        return data.end_date > data.start_date;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["end_date"],
    }
  );

// Schéma de requête pour listing de véhicules
export const vehicleQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum(["active", "inactive", "maintenance", "assigned", "available"])
    .optional(),
  make_id: z.string().uuid().optional(),
  model_id: z.string().uuid().optional(),
  vehicle_class: z.string().optional(),
  fuel_type: z
    .enum([
      "petrol",
      "diesel",
      "hybrid",
      "electric",
      "lng",
      "cng",
      "lpg",
      "hydrogen",
    ])
    .optional(),
  min_year: z.coerce.number().min(1900).optional(),
  max_year: z.coerce
    .number()
    .max(currentYear + 1)
    .optional(),
  min_seats: z.coerce.number().min(2).optional(),
  max_seats: z.coerce.number().max(50).optional(),
  sortBy: z
    .enum(["created_at", "license_plate", "year", "odometer", "updated_at"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schéma de maintenance
export const vehicleMaintenanceSchema = z.object({
  vehicle_id: z.string().uuid(),
  maintenance_type: z.enum([
    "oil_change",
    "tire_rotation",
    "brake_service",
    "inspection",
    "major_service",
    "minor_service",
    "repair",
    "other",
  ]),
  scheduled_date: z.coerce.date(),
  provider_name: z.string().min(1).max(100).optional(),
  provider_contact: z.string().optional(),
  estimated_cost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================================================
// MAINTENANCE SCHEMAS (Fleet Maintenance Module)
// ============================================================================

// Schéma de création de maintenance
export const createMaintenanceSchema = z.object({
  maintenance_type: z.enum([
    "oil_change",
    "service",
    "inspection",
    "tire_rotation",
    "brake_service",
    "repair",
    "other",
  ]),
  scheduled_date: z.coerce.date().refine(
    (val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return val >= today;
    },
    {
      message: "Scheduled date cannot be in the past",
    }
  ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description too long"),
  provider_name: z.string().max(100, "Provider name too long").optional(),
  provider_contact: z.string().max(100, "Provider contact too long").optional(),
  cost_amount: z
    .number()
    .nonnegative("Cost cannot be negative")
    .max(999999.99, "Cost amount too high")
    .optional(),
  cost_currency: z
    .string()
    .length(3, "Currency code must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must be uppercase letters")
    .default("USD"),
  notes: z.string().max(2000, "Notes too long").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Schéma de mise à jour de maintenance
export const updateMaintenanceSchema = z
  .object({
    maintenance_type: z
      .enum([
        "oil_change",
        "service",
        "inspection",
        "tire_rotation",
        "brake_service",
        "repair",
        "other",
      ])
      .optional(),
    status: z
      .enum(["scheduled", "in_progress", "completed", "cancelled"])
      .optional(),
    scheduled_date: z.coerce.date().optional(),
    completed_date: z.coerce.date().optional(),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .max(1000, "Description too long")
      .optional(),
    provider_name: z.string().max(100, "Provider name too long").optional(),
    provider_contact: z
      .string()
      .max(100, "Provider contact too long")
      .optional(),
    cost_amount: z
      .number()
      .nonnegative("Cost cannot be negative")
      .max(999999.99, "Cost amount too high")
      .optional(),
    cost_currency: z
      .string()
      .length(3, "Currency code must be 3 characters")
      .regex(/^[A-Z]{3}$/, "Currency code must be uppercase letters")
      .optional(),
    notes: z.string().max(2000, "Notes too long").optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // If status = completed, completed_date REQUIRED
      if (data.status === "completed" && !data.completed_date) {
        return false;
      }
      return true;
    },
    {
      message: "Completed date is required when status is completed",
      path: ["completed_date"],
    }
  );

// Schéma de requête pour listing de maintenances
export const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["scheduled", "in_progress", "completed", "cancelled"])
    .optional(),
  maintenance_type: z
    .enum([
      "oil_change",
      "service",
      "inspection",
      "tire_rotation",
      "brake_service",
      "repair",
      "other",
    ])
    .optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  sortBy: z
    .enum(["scheduled_date", "completed_date", "created_at", "cost_amount"])
    .default("scheduled_date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// EXPENSE SCHEMAS (Fleet Expenses Module)
// ============================================================================

// Schéma de création d'expense
export const createExpenseSchema = z.object({
  expense_date: z.coerce.date().refine(
    (val) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return val <= today;
    },
    {
      message: "Expense date cannot be in the future",
    }
  ),
  expense_category: z.enum([
    "fuel",
    "toll",
    "parking",
    "wash",
    "repair",
    "fine",
    "other",
  ]),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(999999.99, "Amount too high"),
  currency: z
    .string()
    .length(3, "Currency code must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Currency code must be uppercase letters")
    .default("USD"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long"),
  driver_id: z.string().uuid("Invalid driver ID").optional(),
  ride_id: z.string().uuid("Invalid ride ID").optional(),
  receipt_number: z.string().max(100, "Receipt number too long").optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Schéma de requête pour listing d'expenses
export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  expense_category: z
    .enum(["fuel", "toll", "parking", "wash", "repair", "fine", "other"])
    .optional(),
  reimbursed: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  sortBy: z
    .enum(["expense_date", "amount", "created_at"])
    .default("expense_date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export des types inférés
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleAssignmentInput = z.infer<typeof vehicleAssignmentSchema>;
export type VehicleQueryInput = z.infer<typeof vehicleQuerySchema>;
export type VehicleMaintenanceInput = z.infer<typeof vehicleMaintenanceSchema>;

// New types for Fleet Maintenance & Expenses
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type MaintenanceQueryInput = z.infer<typeof maintenanceQuerySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
