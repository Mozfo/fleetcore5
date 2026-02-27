"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createTenantCountrySchema,
  type CreateTenantCountryInput,
} from "../schemas/tenant-country.schema";

interface TenantOption {
  id: string;
  name: string;
  tenantType: string;
}

interface CountryOption {
  country_code: string;
  country_name_en: string;
  flag_emoji: string;
}

interface TenantCountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** When set, the dialog is in edit mode for this mapping */
  editId?: string | null;
  editData?: {
    tenantId: string;
    countryCode: string;
    isPrimary: boolean;
  };
}

export function TenantCountryDialog({
  open,
  onOpenChange,
  onSuccess,
  editId,
  editData,
}: TenantCountryDialogProps) {
  const isEdit = Boolean(editId);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tenants, setTenants] = React.useState<TenantOption[]>([]);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [mappedCodes, setMappedCodes] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    async function loadData() {
      try {
        const [tenantsRes, countriesRes, mappingsRes] = await Promise.all([
          fetch("/api/admin/tenants"),
          fetch("/api/admin/countries"),
          fetch("/api/admin/tenant-countries"),
        ]);

        if (tenantsRes.ok) {
          const tenantsJson = await tenantsRes.json();
          // Only HQ and division tenants can be assigned countries
          const eligible = (tenantsJson.data ?? []).filter(
            (t: { tenantType: string; status: string }) =>
              (t.tenantType === "headquarters" ||
                t.tenantType === "division") &&
              t.status !== "cancelled"
          );
          setTenants(
            eligible.map(
              (t: { id: string; name: string; tenantType: string }) => ({
                id: t.id,
                name: t.name,
                tenantType: t.tenantType,
              })
            )
          );
        }

        if (countriesRes.ok) {
          const countriesJson = await countriesRes.json();
          setCountries(countriesJson.data ?? []);
        }

        if (mappingsRes.ok) {
          const mappingsJson = await mappingsRes.json();
          const codes = new Set<string>(
            (mappingsJson.data ?? []).map(
              (m: { countryCode: string }) => m.countryCode
            )
          );
          setMappedCodes(codes);
        }
      } catch {
        // Non-blocking
      }
    }
    void loadData();
  }, [open]);

  const form = useForm<CreateTenantCountryInput>({
    resolver: zodResolver(createTenantCountrySchema),
    defaultValues: {
      tenantId: "",
      countryCode: "",
      isPrimary: false,
    },
  });

  // Reset form when opening with edit data
  React.useEffect(() => {
    if (open && editData) {
      form.reset({
        tenantId: editData.tenantId,
        countryCode: editData.countryCode,
        isPrimary: editData.isPrimary,
      });
    } else if (open && !editId) {
      form.reset({ tenantId: "", countryCode: "", isPrimary: false });
    }
  }, [open, editData, editId, form]);

  // Available countries = all countries minus already mapped (except current edit)
  const availableCountries = React.useMemo(() => {
    if (isEdit) return countries; // In edit mode, show all (country is locked)
    return countries.filter((c) => !mappedCodes.has(c.country_code));
  }, [countries, mappedCodes, isEdit]);

  async function onSubmit(values: CreateTenantCountryInput) {
    setIsSubmitting(true);
    try {
      if (isEdit && editId) {
        // PATCH — only update tenant and isPrimary
        const res = await fetch(`/api/admin/tenant-countries/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: values.tenantId,
            is_primary: values.isPrimary,
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error ?? "Failed to update country routing");
          return;
        }
        toast.success("Country routing updated");
      } else {
        // POST — create
        const res = await fetch("/api/admin/tenant-countries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? "Failed to save country routing");
          return;
        }
        toast.success("Country routing saved");
      }
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Assign Managing Team" : "Add Country"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCountries.map((c) => (
                        <SelectItem key={c.country_code} value={c.country_code}>
                          {c.flag_emoji} {c.country_name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Managing Team *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select managing team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.tenantType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Role *
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleHelp className="text-muted-foreground size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Defines how this team handles leads from this country
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "true")}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        value="true"
                        description="Primary team that receives and manages all incoming leads from this country"
                      >
                        Main Team
                      </SelectItem>
                      <SelectItem
                        value="false"
                        description="Backup team that assists when the main team is unavailable or overloaded"
                      >
                        Support Team
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Add Country"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
