import { z } from "zod";

export const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  tenantId: z.string().uuid("Please select a tenant"),
  role: z.enum(["member", "admin"]),
  preferredLanguage: z.string().optional(),
  sendInvitation: z.boolean(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
