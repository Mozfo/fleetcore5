"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  createInvitationSchema,
  type CreateInvitationInput,
} from "../schemas/invitation.schema";

interface OrgOption {
  id: string;
  name: string;
}

interface InviteFormProps {
  onSuccess?: () => void;
}

export function InviteForm({ onSuccess }: InviteFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orgs, setOrgs] = React.useState<OrgOption[]>([]);

  // Fetch organizations for the select
  React.useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch("/api/adm/settings/organizations");
        if (!res.ok) return;
        const json = await res.json();
        setOrgs(
          json.data.map((o: { id: string; name: string }) => ({
            id: o.id,
            name: o.name,
          }))
        );
      } catch {
        // Non-blocking
      }
    }
    void loadOrgs();
  }, []);

  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      email: "",
      organizationId: "",
      role: "member",
    },
  });

  async function onSubmit(values: CreateInvitationInput) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/adm/settings/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to send invitation");
        return;
      }
      toast.success("Invitation sent successfully");
      form.reset();
      onSuccess?.();
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-5" />
          Send Invitation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Organization</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select org" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
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
                <FormItem className="w-40">
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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

            <Button type="submit" disabled={isSubmitting} className="shrink-0">
              <Send className="mr-2 size-4" />
              {isSubmitting ? "Sending..." : "Invite"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
