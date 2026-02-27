import { z } from "zod";

export const createTenantCountrySchema = z.object({
  tenantId: z.string().uuid("Please select a tenant"),
  countryCode: z.string().length(2, "Please select a country"),
  isPrimary: z.boolean(),
});

export type CreateTenantCountryInput = z.infer<
  typeof createTenantCountrySchema
>;
