import { NextResponse } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import type { SettingsMember } from "@/features/settings/types/member.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCrmApiAuth();

    const members = await prisma.adm_members.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: "desc" },
      include: {
        adm_tenants: {
          select: { id: true, name: true, country_code: true },
        },
      },
    });

    const data: SettingsMember[] = members.map((m) => {
      const firstName = m.first_name ?? null;
      const lastName = m.last_name ?? null;
      const name = [firstName, lastName].filter(Boolean).join(" ") || m.email;

      return {
        id: m.id,
        authUserId: m.auth_user_id ?? "",
        firstName,
        lastName,
        name,
        email: m.email,
        phone: m.phone,
        role: m.role,
        status: m.status,
        preferredLanguage: m.preferred_language,
        twoFactorEnabled: m.two_factor_enabled ?? false,
        lastLoginAt: m.last_login_at?.toISOString() ?? null,
        createdAt: m.created_at.toISOString(),
        tenantId: m.tenant_id,
        tenantName: m.adm_tenants.name,
        tenantCountryCode: m.adm_tenants.country_code ?? "",
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
