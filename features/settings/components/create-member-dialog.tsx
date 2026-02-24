"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleHelp } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PhoneInput } from "@/components/forms/PhoneInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";
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
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import {
  createMemberSchema,
  type CreateMemberInput,
} from "../schemas/member.schema";

interface TenantOption {
  id: string;
  name: string;
}

interface CountryOption {
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  flag_emoji: string | null;
  phone_prefix: string | null;
  phone_example: string | null;
  phone_min_digits: number | null;
}

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tenants, setTenants] = React.useState<TenantOption[]>([]);
  const [countries, setCountries] = React.useState<CountryOption[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = React.useState("AE");
  const { locale } = useLocalizedPath();

  React.useEffect(() => {
    if (!open) return;
    async function loadData() {
      try {
        const [tenantsRes, countriesRes] = await Promise.all([
          fetch("/api/admin/tenants"),
          fetch("/api/admin/countries"),
        ]);
        if (tenantsRes.ok) {
          const tenantsJson = await tenantsRes.json();
          setTenants(
            tenantsJson.data.map((t: { id: string; name: string }) => ({
              id: t.id,
              name: t.name,
            }))
          );
        }
        if (countriesRes.ok) {
          const countriesJson = await countriesRes.json();
          setCountries(countriesJson.data);
        }
      } catch {
        // Non-blocking
      }
    }
    void loadData();
  }, [open]);

  const form = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      tenantId: "",
      role: "member",
      preferredLanguage: locale,
      sendInvitation: true,
    },
  });

  async function onSubmit(values: CreateMemberInput) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to create member");
        return;
      }
      const emailSent = json.emailSent === true;
      const message = values.sendInvitation
        ? emailSent
          ? "Member created and invitation email sent"
          : "Member created but invitation email failed to send"
        : "Member created successfully";
      toast.success(message);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <PhoneInput
                      countries={countries}
                      selectedCountryCode={phoneCountryCode}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onPrefixChange={setPhoneCountryCode}
                      locale={locale}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Tenant *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleHelp className="text-muted-foreground size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          The organization this member belongs to
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Role *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CircleHelp className="text-muted-foreground size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Admin has full access; Member has limited permissions
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Language
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CircleHelp className="text-muted-foreground size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Language used for emails and interface
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sendInvitation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Send invitation email
                  </FormLabel>
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
                {isSubmitting ? "Creating..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
