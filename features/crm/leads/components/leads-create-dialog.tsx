"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreate } from "@refinedev/core";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
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
import { Select } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

// ===== ZOD SCHEMA =====

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

// ===== COMPONENT =====

interface LeadsCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadsCreateDialog({
  open,
  onOpenChange,
}: LeadsCreateDialogProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const { options: fleetSizeOptions, getLabel: getFleetSizeLabel } =
    useFleetSizeOptions();

  const schema = useMemo(() => createLeadFormSchema(t), [t]);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company_name: "",
      country_code: "",
      city: "",
      fleet_size: "",
      current_software: "",
      website_url: "",
      priority: "",
      assigned_to_id: "",
      source: "website",
      message: "",
    },
  });

  const { mutate: createLead, mutation } = useCreate();
  const isCreating = mutation.isPending;

  const onSubmit = (data: LeadFormValues) => {
    createLead(
      {
        resource: "leads",
        values: {
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
        },
        successNotification: {
          type: "success",
          message: t("leads.toast.success_created"),
        },
        errorNotification: {
          type: "error",
          message: t("leads.toast.error_generic"),
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("leads.modal.title_create")}</DialogTitle>
          <DialogDescription>
            {t("leads.modal.description_create")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="create-lead-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Section: Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("leads.modal.section_contact")}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.first_name")}{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.last_name")}{" "}
                        <span className="text-destructive">*</span>
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
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.email")}{" "}
                        <span className="text-destructive">*</span>
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
              <h3 className="text-sm font-medium">
                {t("leads.modal.section_company")}
              </h3>

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("leads.modal.company_name")}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Fleet Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.country")}{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select {...field}>
                          <option value="">
                            {t("leads.modal.select_country")}
                          </option>
                          {COUNTRY_OPTIONS.map((country) => (
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
                <FormField
                  control={form.control}
                  name="fleet_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("leads.modal.fleet_size")}{" "}
                        <span className="text-destructive">*</span>
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
              <h3 className="text-sm font-medium">
                {t("leads.modal.section_management")}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

                <FormField
                  control={form.control}
                  name="assigned_to_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("leads.modal.assigned_to")}</FormLabel>
                      <FormControl>
                        <Select {...field} disabled>
                          <option value="">
                            {t("leads.modal.auto_assign")}
                          </option>
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
              <h3 className="text-sm font-medium">
                {t("leads.modal.section_additional")}
              </h3>

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
          </form>
        </Form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            {t("leads.modal.cancel")}
          </Button>
          <Button type="submit" form="create-lead-form" disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isCreating
              ? t("leads.modal.submitting")
              : t("leads.modal.submit_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
