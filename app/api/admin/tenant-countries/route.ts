import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { createTenantCountrySchema } from "@/features/settings/schemas/tenant-country.schema";
import type { SettingsTenantCountry } from "@/features/settings/types/tenant-country.types";

export const dynamic = "force-dynamic";

/** GET — list all tenant-country mappings */
export async function GET() {
  try {
    await requireCrmApiAuth();

    const mappings = await prisma.adm_tenant_countries.findMany({
      orderBy: { created_at: "desc" },
      include: {
        adm_tenants: {
          select: { name: true, tenant_type: true },
        },
      },
    });

    // Fetch country display data from crm_countries
    const countryCodes = mappings.map((m) => m.country_code);
    const countries = await prisma.crm_countries.findMany({
      where: { country_code: { in: countryCodes } },
      select: {
        country_code: true,
        country_name_en: true,
        flag_emoji: true,
      },
    });
    const countryMap = new Map(countries.map((c) => [c.country_code, c]));

    const data: SettingsTenantCountry[] = mappings.map((m) => {
      const country = countryMap.get(m.country_code);
      return {
        id: m.id,
        tenantId: m.tenant_id,
        tenantName: m.adm_tenants.name,
        tenantType: m.adm_tenants.tenant_type ?? "unknown",
        countryCode: m.country_code,
        countryName: country?.country_name_en ?? m.country_code,
        flagEmoji: country?.flag_emoji ?? "",
        isPrimary: m.is_primary,
        createdAt: m.created_at.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: { total: data.length },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** POST — create a new tenant-country mapping */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await requireCrmApiAuth();

    const body = await req.json();
    const parsed = createTenantCountrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { tenantId, countryCode, isPrimary } = parsed.data;

    // Check country is not already mapped
    const existing = await prisma.adm_tenant_countries.findFirst({
      where: { country_code: countryCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This country is already assigned to a tenant" },
        { status: 409 }
      );
    }

    // Verify tenant exists and is not soft-deleted
    const tenant = await prisma.adm_tenants.findFirst({
      where: { id: tenantId, deleted_at: null },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const mapping = await prisma.adm_tenant_countries.create({
      data: {
        tenant_id: tenantId,
        country_code: countryCode,
        is_primary: isPrimary,
        created_by: userId,
        updated_by: userId,
      },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenant_countries",
        entity_id: mapping.id,
        action: "create_tenant_country",
        new_values: { tenantId, countryCode, isPrimary, createdBy: userId },
        severity: "info",
        category: "operational",
      },
    });

    return NextResponse.json({ success: true, id: mapping.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
