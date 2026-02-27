import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCrmApiAuth();
    const { id } = await params;

    // Fetch all data in parallel
    const [org, tenant, members, invitations] = await Promise.all([
      prisma.auth_organization.findUnique({
        where: { id },
      }),
      prisma.adm_tenants.findUnique({
        where: { id },
        select: {
          tenant_type: true,
          country_code: true,
          default_currency: true,
          status: true,
          timezone: true,
        },
      }),
      prisma.adm_members.findMany({
        where: { tenant_id: id, deleted_at: null },
        orderBy: { created_at: "asc" },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.auth_invitation.findMany({
        where: { organization_id: id },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          expires_at: true,
          created_at: true,
        },
      }),
    ]);

    if (!org) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const data = {
      id: org.id,
      name: org.name,
      slug: org.slug ?? "",
      tenantType: tenant?.tenant_type ?? "unknown",
      countryCode: tenant?.country_code ?? "",
      defaultCurrency: tenant?.default_currency ?? "",
      status: tenant?.status ?? "unknown",
      timezone: tenant?.timezone ?? "",
      memberCount: members.length,
      createdAt: org.created_at.toISOString(),
      metadata: org.metadata,
      members: members.map((m) => ({
        id: m.id,
        name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
        email: m.email,
        role: m.role,
        status: m.status,
        joinedAt: m.created_at.toISOString(),
      })),
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expires_at.toISOString(),
        createdAt: inv.created_at.toISOString(),
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** PATCH — update tenant fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    const tenant = await prisma.adm_tenants.findFirst({
      where: { id, deleted_at: null },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await req.json();
    const allowedFields = [
      "status",
      "name",
      "country_code",
      "tenant_type",
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date();

    await prisma.adm_tenants.update({
      where: { id },
      data: updateData,
    });

    // Sync name to auth_organization if updated
    if (updateData.name) {
      await prisma.auth_organization.update({
        where: { id },
        data: { name: updateData.name as string },
      });
    }

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenants",
        entity_id: id,
        action: "update_tenant",
        new_values: { ...updateData, updatedBy: adminUserId },
        severity: "info",
        category: "operational",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** DELETE — soft delete tenant (with active member protection) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    const tenant = await prisma.adm_tenants.findFirst({
      where: { id, deleted_at: null },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // PROTECTION: count active members
    const activeMemberCount = await prisma.adm_members.count({
      where: { tenant_id: id, deleted_at: null },
    });

    if (activeMemberCount > 0) {
      return NextResponse.json(
        {
          error:
            `This tenant has ${activeMemberCount} active member(s). ` +
            `Reassign or remove members before deleting this tenant.`,
          count: activeMemberCount,
        },
        { status: 409 }
      );
    }

    // Soft-delete tenant
    await prisma.adm_tenants.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenants",
        entity_id: id,
        action: "delete_tenant",
        new_values: { name: tenant.name, deletedBy: adminUserId },
        severity: "warning",
        category: "operational",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
