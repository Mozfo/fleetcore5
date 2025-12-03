/**
 * LeadFormModal - Modal de création/édition de lead
 *
 * Formulaire complet avec:
 * - Contact Info: first_name, last_name, email, phone
 * - Company Details: company_name, country_code, fleet_size, current_software
 * - Additional Info: message
 * - Section GDPR conditionnelle (TODO D7-B)
 *
 * @module components/crm/leads/LeadFormModal
 */

"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { useFleetSizeOptions } from "@/lib/hooks/useFleetSizeOptions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";

// ===== FORM SCHEMA =====

/**
 * Zod schema factory for lead form validation
 * Matches API v1 CreateLeadSchema requirements
 * Takes translation function for i18n support
 */
const createLeadFormSchema = (t: (key: string) => string) =>
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

    // Lead management
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

type LeadFormValues = z.infer<ReturnType<typeof createLeadFormSchema>>;

// ===== CONSTANTS =====

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "paid_ad", label: "Paid Ad" },
  { value: "social_media", label: "Social Media" },
  { value: "event", label: "Event" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
] as const;

// Common countries for fleet management (top markets)
const COUNTRY_OPTIONS = [
  { value: "AE", label: "United Arab Emirates", flag: "🇦🇪" },
  { value: "SA", label: "Saudi Arabia", flag: "🇸🇦" },
  { value: "QA", label: "Qatar", flag: "🇶🇦" },
  { value: "KW", label: "Kuwait", flag: "🇰🇼" },
  { value: "BH", label: "Bahrain", flag: "🇧🇭" },
  { value: "OM", label: "Oman", flag: "🇴🇲" },
  { value: "FR", label: "France", flag: "🇫🇷" },
  { value: "DE", label: "Germany", flag: "🇩🇪" },
  { value: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { value: "ES", label: "Spain", flag: "🇪🇸" },
  { value: "IT", label: "Italy", flag: "🇮🇹" },
  { value: "NL", label: "Netherlands", flag: "🇳🇱" },
  { value: "BE", label: "Belgium", flag: "🇧🇪" },
  { value: "US", label: "United States", flag: "🇺🇸" },
  { value: "CA", label: "Canada", flag: "🇨🇦" },
  { value: "EG", label: "Egypt", flag: "🇪🇬" },
  { value: "MA", label: "Morocco", flag: "🇲🇦" },
  { value: "TN", label: "Tunisia", flag: "🇹🇳" },
  { value: "DZ", label: "Algeria", flag: "🇩🇿" },
  { value: "JO", label: "Jordan", flag: "🇯🇴" },
  { value: "LB", label: "Lebanon", flag: "🇱🇧" },
] as const;

// ===== COMPONENT =====

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: Lead) => void;
  mode?: "create" | "edit";
  initialData?: Partial<Lead>;
  countries?: Array<{
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  }>;
  owners?: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
  }>;
}

export function LeadFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "create",
  initialData,
  countries,
  owners = [],
}: LeadFormModalProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  // Dynamic fleet size options from CRM settings
  const { options: fleetSizeOptions, getLabel: getFleetSizeLabel } =
    useFleetSizeOptions();

  // Create schema with i18n translations
  const schema = useMemo(() => createLeadFormSchema(t), [t]);

  // Use provided countries or fallback to defaults
  const countryOptions = countries?.length
    ? countries.map((c) => ({
        value: c.country_code,
        label: c.country_name_en,
        flag: c.flag_emoji,
      }))
    : COUNTRY_OPTIONS;

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      company_name: initialData?.company_name || "",
      country_code: initialData?.country_code || "",
      city: "",
      fleet_size: initialData?.fleet_size || "",
      current_software: "",
      website_url: "",
      priority: "",
      assigned_to_id: "",
      source: "website",
      message: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: LeadFormValues) => {
    try {
      // Build request body for API
      const requestBody = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || undefined,
        company_name: data.company_name,
        country_code: data.country_code,
        city: data.city || undefined,
        fleet_size: data.fleet_size,
        current_software: data.current_software || undefined,
        website_url: data.website_url || undefined,
        priority: data.priority || undefined,
        assigned_to_id: data.assigned_to_id || undefined,
        source: data.source || "website",
        message: data.message || undefined,
      };

      // POST to API
      const response = await fetch("/api/v1/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (result.error?.code === "DUPLICATE_EMAIL") {
          toast.error(t("leads.toast.error_email_exists"));
          return;
        }
        if (result.error?.code === "VALIDATION_ERROR") {
          toast.error(t("leads.toast.error_validation"));
          return;
        }
        // Generic error
        toast.error(t("leads.toast.error_generic"));
        return;
      }

      // Success: show toast, call callback, close modal
      toast.success(t("leads.toast.success_created"));

      // Map API response to Lead type for callback
      if (onSuccess && result.data) {
        const createdLead: Lead = {
          // Core identifiers
          id: result.data.id,
          lead_code: result.data.lead_code,
          // Contact info
          email: result.data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || null,
          // Company info
          company_name: data.company_name,
          industry: null,
          company_size: null,
          fleet_size: data.fleet_size,
          current_software: data.current_software || null,
          website_url: null,
          linkedin_url: null,
          // Location
          country_code: data.country_code,
          country: null, // Will be refreshed from server
          city: null,
          // Status
          status: result.data.status,
          lead_stage: result.data.lead_stage,
          priority: result.data.priority,
          // Scoring
          fit_score: result.data.fit_score,
          engagement_score: result.data.engagement_score,
          qualification_score: result.data.qualification_score,
          scoring: null,
          // Source
          source: null,
          source_id: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          // Message
          message: data.message || null,
          qualification_notes: null,
          // Assignment
          assigned_to: null, // Will be refreshed from server
          // GDPR
          gdpr_consent: null,
          consent_at: null,
          consent_ip: null,
          // Dates
          created_at: result.data.created_at,
          updated_at: null,
          qualified_date: null,
          converted_date: null,
          next_action_date: null,
          // Opportunity
          opportunity_id: null,
          // Metadata
          metadata: null,
        };
        onSuccess(createdLead);
      }

      form.reset();
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console -- Error logging intentionnel
      console.error("Lead creation error:", error);
      toast.error(t("leads.toast.error_generic"));
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      modal={false}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("leads.modal.title_create")
              : t("leads.modal.title_edit")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("leads.modal.description_create")
              : t("leads.modal.description_edit")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("leads.modal.section_contact")}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.first_name")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.last_name")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.email")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.doe@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.phone")}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+971501234567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section: Company Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("leads.modal.section_company")}
              </h3>

              {/* Company Name */}
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("leads.modal.company_name")}{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Fleet Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Country */}
                <FormField
                  control={form.control}
                  name="country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.country")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <option value="">
                            {t("leads.modal.select_country")}
                          </option>
                          {countryOptions.map((country) => (
                            <option key={country.value} value={country.value}>
                              {country.flag} {country.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.city")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("leads.modal.city_placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Fleet Size */}
                <FormField
                  control={form.control}
                  name="fleet_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.fleet_size")}{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <option value="">
                            {t("leads.modal.select_fleet_size")}
                          </option>
                          {fleetSizeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {getFleetSizeLabel(option.value, locale)}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Software */}
                <FormField
                  control={form.control}
                  name="current_software"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.current_software")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            "leads.modal.current_software_placeholder"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Website URL */}
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("leads.modal.website_url")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("leads.modal.website_url_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section: Lead Management */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("leads.modal.section_management")}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Source */}
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.source")}</FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <option value="">
                            {t("leads.modal.select_source")}
                          </option>
                          {SOURCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {t(`leads.modal.source_options.${option.value}`)}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.priority")}</FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <option value="">
                            {t("leads.modal.auto_calculate")}
                          </option>
                          {PRIORITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {t(`leads.card.priority.${option.value}`)}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assigned_to_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.assigned_to")}</FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <option value="">
                            {t("leads.modal.auto_assign")}
                          </option>
                          {owners.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                              {owner.first_name} {owner.last_name || ""}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section: Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t("leads.modal.section_additional")}
              </h3>

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("leads.modal.message")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("leads.modal.message_placeholder")}
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* GDPR: Not needed in backoffice (legitimate interest basis - Art. 6.1.f)
                Only public /request-demo form requires explicit consent */}

            {/* Footer Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t("leads.modal.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting
                  ? t("leads.modal.submitting")
                  : mode === "create"
                    ? t("leads.modal.submit_create")
                    : t("leads.modal.submit_edit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
