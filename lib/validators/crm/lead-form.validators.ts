/**
 * Lead Form Schema — Single Source of Truth for create/edit forms.
 *
 * Used by:
 * - features/crm/leads/components/leads-create-dialog.tsx
 * - features/crm/leads/components/leads-edit-drawer.tsx
 * - components/crm/leads/LeadFormModal.tsx (old UI)
 *
 * @module lib/validators/crm/lead-form.validators
 */

import { z } from "zod";

/**
 * Creates a Zod schema for the Lead create/edit form.
 * Accepts a translation function for i18n error messages.
 */
export const createLeadFormSchema = (t: (key: string) => string) =>
  z.object({
    first_name: z
      .string()
      .min(2, t("leads.modal.validation.first_name_min"))
      .max(50, t("leads.modal.validation.first_name_max"))
      .regex(/^[^0-9]*$/, t("leads.modal.validation.first_name_no_digits")),

    last_name: z
      .string()
      .min(2, t("leads.modal.validation.last_name_min"))
      .max(50, t("leads.modal.validation.last_name_max"))
      .regex(/^[^0-9]*$/, t("leads.modal.validation.last_name_no_digits")),

    email: z
      .string()
      .min(1, t("leads.modal.validation.email_required"))
      .email(t("leads.modal.validation.email_invalid"))
      .max(255, t("leads.modal.validation.email_max")),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, t("leads.modal.validation.phone_invalid"))
      .optional()
      .or(z.literal("")),

    company_name: z
      .string()
      .min(2, t("leads.modal.validation.company_min"))
      .max(100, t("leads.modal.validation.company_max")),

    country_code: z
      .string()
      .length(2, t("leads.modal.validation.country_required")),

    city: z
      .string()
      .max(100, t("leads.modal.validation.city_max"))
      .optional()
      .or(z.literal("")),

    fleet_size: z
      .string()
      .min(1, t("leads.modal.validation.fleet_size_required")),

    current_software: z
      .string()
      .max(100, t("leads.modal.validation.software_max"))
      .optional()
      .or(z.literal("")),

    website_url: z
      .string()
      .max(500, t("leads.modal.validation.website_max"))
      .optional()
      .or(z.literal("")),

    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .optional()
      .or(z.literal("")),

    assigned_to_id: z
      .string()
      .uuid(t("leads.modal.validation.employee_invalid"))
      .optional()
      .or(z.literal("")),

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
      .optional()
      .or(z.literal("")),

    message: z
      .string()
      .max(1000, t("leads.modal.validation.message_max"))
      .optional()
      .or(z.literal("")),
  });

export type LeadFormValues = z.infer<ReturnType<typeof createLeadFormSchema>>;
