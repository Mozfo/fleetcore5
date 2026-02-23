import { NextResponse } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import type {
  SettingsOrg,
  SettingsOrgsResponse,
} from "@/features/settings/types/org.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCrmApiAuth();

    // Join auth_organization with adm_tenants for tenant_type
    // and count members per org
    const orgs = await prisma.auth_organization.findMany({
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Fetch tenant_types from adm_tenants (shared-ID pattern)
    const orgIds = orgs.map((o) => o.id);
    const tenants = await prisma.adm_tenants.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, tenant_type: true },
    });
    const tenantTypeMap = new Map(tenants.map((t) => [t.id, t.tenant_type]));

    const data: SettingsOrg[] = orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug ?? "",
      tenantType: tenantTypeMap.get(o.id) ?? "unknown",
      memberCount: o._count.members,
      createdAt: o.created_at.toISOString(),
    }));

    const response: SettingsOrgsResponse = { data, total: data.length };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
