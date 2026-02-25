import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import type { SettingsMember } from "@/features/settings/types/member.types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCrmApiAuth();
    const { id } = await params;

    const member = await prisma.adm_members.findFirst({
      where: { id, deleted_at: null },
      include: {
        adm_tenants: {
          select: { id: true, name: true, country_code: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const firstName = member.first_name ?? null;
    const lastName = member.last_name ?? null;
    const name =
      [firstName, lastName].filter(Boolean).join(" ") || member.email;

    const data: SettingsMember = {
      id: member.id,
      authUserId: member.auth_user_id ?? "",
      firstName,
      lastName,
      name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      status: member.status,
      preferredLanguage: member.preferred_language,
      twoFactorEnabled: member.two_factor_enabled ?? false,
      lastLoginAt: member.last_login_at?.toISOString() ?? null,
      createdAt: member.created_at.toISOString(),
      tenantId: member.tenant_id,
      tenantName: member.adm_tenants.name,
      tenantCountryCode: member.adm_tenants.country_code ?? "",
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** PATCH — update member fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    const member = await prisma.adm_members.findFirst({
      where: { id, deleted_at: null },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const body = await req.json();
    const allowedFields = [
      "first_name",
      "last_name",
      "phone",
      "role",
      "preferred_language",
      "status",
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

    await prisma.adm_members.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_members",
        entity_id: id,
        action: "update_member",
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

/** DELETE — soft delete member */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    const member = await prisma.adm_members.findFirst({
      where: { id, deleted_at: null },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.adm_members.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_members",
        entity_id: id,
        action: "delete_member",
        new_values: { email: member.email, deletedBy: adminUserId },
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
