import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** PATCH — update a tenant-country mapping */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    const mapping = await prisma.adm_tenant_countries.findUnique({
      where: { id },
    });
    if (!mapping) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
    }

    const body = await req.json();
    const allowedFields = ["tenant_id", "is_primary"] as const;

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

    // If changing tenant, verify it exists
    if (updateData.tenant_id) {
      const tenant = await prisma.adm_tenants.findFirst({
        where: { id: updateData.tenant_id as string, deleted_at: null },
      });
      if (!tenant) {
        return NextResponse.json(
          { error: "Tenant not found" },
          { status: 404 }
        );
      }
    }

    updateData.updated_at = new Date();
    updateData.updated_by = adminUserId;

    await prisma.adm_tenant_countries.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenant_countries",
        entity_id: id,
        action: "update_tenant_country",
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

/** DELETE — remove a tenant-country mapping (hard delete) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    const mapping = await prisma.adm_tenant_countries.findUnique({
      where: { id },
    });
    if (!mapping) {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 });
    }

    await prisma.adm_tenant_countries.delete({
      where: { id },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenant_countries",
        entity_id: id,
        action: "delete_tenant_country",
        new_values: {
          countryCode: mapping.country_code,
          tenantId: mapping.tenant_id,
          deletedBy: adminUserId,
        },
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
