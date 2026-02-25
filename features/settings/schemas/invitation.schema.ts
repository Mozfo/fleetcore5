import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  tenantId: z.string().uuid("Please select a tenant"),
  role: z.enum(["member", "admin", "org:adm_admin"]),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
