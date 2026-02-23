import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  organizationId: z.string().uuid("Invalid organization"),
  role: z.enum(["member", "admin", "org:adm_admin"]),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
