import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  tenantType: z.enum(["client", "headquarters", "division"]),
  countryCode: z.string().length(2, "Please select a country"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
