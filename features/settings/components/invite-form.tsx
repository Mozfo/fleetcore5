"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";

interface TenantOption {
  id: string;
  name: string;
}

interface InviteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const inviteFormSchema = z.object({
  emails: z.string().min(1, "At least one email is required"),
  tenantId: z.string().uuid("Please select a tenant"),
  role: z.enum(["member", "admin", "org:adm_admin"]),
});

type InviteFormInput = z.infer<typeof inviteFormSchema>;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,\n;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function InviteFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [tenants, setTenants] = React.useState<TenantOption[]>([]);

  React.useEffect(() => {
    if (!open) return;
    async function loadTenants() {
      try {
        const res = await fetch("/api/admin/tenants");
        if (!res.ok) return;
        const json = await res.json();
        setTenants(
          json.data.map((t: { id: string; name: string }) => ({
            id: t.id,
            name: t.name,
          }))
        );
      } catch {
        // Non-blocking
      }
    }
    void loadTenants();
  }, [open]);

  const form = useForm<InviteFormInput>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      emails: "",
      tenantId: "",
      role: "member",
    },
  });

  async function onSubmit(values: InviteFormInput) {
    const emails = parseEmails(values.emails);
    const invalidEmails = emails.filter((e) => !isValidEmail(e));

    if (emails.length === 0) {
      form.setError("emails", {
        message: "At least one valid email is required",
      });
      return;
    }

    if (invalidEmails.length > 0) {
      form.setError("emails", {
        message: `Invalid emails: ${invalidEmails.join(", ")}`,
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const email of emails) {
      try {
        const res = await fetch("/api/admin/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            tenantId: values.tenantId,
            role: values.role,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          successCount++;
        } else {
          errors.push(`${email}: ${json.error ?? "Failed"}`);
        }
      } catch {
        errors.push(`${email}: Network error`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} invitation(s) sent successfully`);
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    }
    if (errors.length > 0) {
      toast.error(errors.join("\n"));
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5" />
            Send Invitations
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emails</FormLabel>
                  <FormControl>
                    <Textarea
                      className="placeholder:opacity-50"
                      placeholder={"user1@example.com\nuser2@example.com"}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    One or more emails separated by commas, semicolons, or new
                    lines.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
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
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="org:adm_admin">Super Admin</SelectItem>
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
                <Send className="mr-2 size-4" />
                {isSubmitting ? "Sending..." : "Send Invitations"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
