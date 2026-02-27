import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { createTenantSchema } from "@/features/settings/schemas/tenant.schema";
import type { SettingsTenant } from "@/features/settings/types/tenant.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCrmApiAuth();

    // Fetch orgs, tenants (including soft-deleted), and member counts in parallel
    const [orgs, tenants, memberCounts] = await Promise.all([
      prisma.auth_organization.findMany({
        orderBy: { created_at: "desc" },
      }),
      prisma.adm_tenants.findMany({
        select: {
          id: true,
          tenant_type: true,
          country_code: true,
          default_currency: true,
          status: true,
          timezone: true,
          tenant_code: true,
          deleted_at: true,
        },
      }),
      prisma.adm_members.groupBy({
        by: ["tenant_id"],
        where: { deleted_at: null },
        _count: { id: true },
      }),
    ]);

    const tenantMap = new Map(tenants.map((t) => [t.id, t]));
    const countMap = new Map(
      memberCounts.map((c) => [c.tenant_id, c._count.id])
    );

    // Include orgs that have an adm_tenants row (active + soft-deleted)
    const data: SettingsTenant[] = orgs
      .filter((o) => tenantMap.has(o.id))
      .map((o) => {
        const t = tenantMap.get(o.id);
        if (!t) throw new Error(`Tenant not found for org ${o.id}`);
        const isCancelled = t.deleted_at !== null;
        return {
          id: o.id,
          name: o.name,
          slug: o.slug ?? "",
          tenantType: t.tenant_type ?? "unknown",
          tenantCode: t.tenant_code ?? null,
          countryCode: t.country_code ?? "",
          defaultCurrency: t.default_currency ?? "",
          status: isCancelled ? "cancelled" : (t.status ?? "unknown"),
          timezone: t.timezone ?? "",
          memberCount: countMap.get(o.id) ?? 0,
          createdAt: o.created_at.toISOString(),
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

/** POST — create a new tenant (auth_organization + adm_tenants shared-ID pattern) */
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await requireCrmApiAuth();

    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, tenantType, countryCode } = parsed.data;

    // Auto-deduce currency/timezone from dir_country_locales
    const locale = await prisma.dir_country_locales.findFirst({
      where: { country_code: countryCode, deleted_at: null },
      select: { currency: true, timezone: true },
    });

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const existingOrg = await prisma.auth_organization.findFirst({
      where: { slug },
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: "A tenant with a similar name already exists" },
        { status: 409 }
      );
    }

    // Create with shared-ID pattern
    const tenantId = crypto.randomUUID();

    await prisma.auth_organization.create({
      data: {
        id: tenantId,
        name,
        slug,
        created_at: new Date(),
      },
    });

    await prisma.adm_tenants.create({
      data: {
        id: tenantId,
        name,
        country_code: countryCode,
        tenant_type: tenantType,
        default_currency: locale?.currency ?? "EUR",
        timezone: locale?.timezone ?? "UTC",
        status: "active",
      },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenants",
        entity_id: tenantId,
        action: "create_tenant",
        new_values: { name, tenantType, countryCode, createdBy: userId },
        severity: "info",
        category: "operational",
      },
    });

    return NextResponse.json({ success: true, tenantId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
