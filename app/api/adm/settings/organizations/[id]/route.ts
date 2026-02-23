import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import type { SettingsOrgDetail } from "@/features/settings/types/org.types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCrmApiAuth();
    const { id } = await params;

    const org = await prisma.auth_organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get tenant_type from adm_tenants (shared-ID pattern)
    const tenant = await prisma.adm_tenants.findUnique({
      where: { id },
      select: { tenant_type: true },
    });

    const data: SettingsOrgDetail = {
      id: org.id,
      name: org.name,
      slug: org.slug ?? "",
      tenantType: tenant?.tenant_type ?? "unknown",
      memberCount: org.members.length,
      createdAt: org.created_at.toISOString(),
      metadata: org.metadata,
      members: org.members.map((m) => ({
        userId: m.user_id,
        userName: m.user.name,
        userEmail: m.user.email,
        role: m.role,
        joinedAt: m.created_at.toISOString(),
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
