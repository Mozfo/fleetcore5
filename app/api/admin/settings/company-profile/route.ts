import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CompanyProfileData } from "@/features/settings/types/company-profile.types";

export const dynamic = "force-dynamic";

const PROFILE_CATEGORY = "company_profile";
const PROFILE_KEY = "profile";

/** GET — retrieve company profile for current tenant */
export async function GET() {
  try {
    const { orgId } = await requireCrmApiAuth();

    // Fetch setting and tenant info in parallel
    const [setting, tenant] = await Promise.all([
      prisma.adm_tenant_settings.findFirst({
        where: {
          tenant_id: orgId,
          category: PROFILE_CATEGORY,
          setting_key: PROFILE_KEY,
        },
      }),
      prisma.adm_tenants.findUnique({
        where: { id: orgId },
        select: { country_code: true, name: true },
      }),
    ]);

    const profile: CompanyProfileData = setting
      ? (setting.setting_value as unknown as CompanyProfileData)
      : {
          identity: {
            legal_name: tenant?.name ?? "",
            trade_name: "",
            website: "",
            legal_form: "",
          },
          address: {
            street: "",
            city: "",
            postal_code: "",
            country: tenant?.country_code ?? "",
          },
          legal: {},
          contacts: {
            primary_email: "",
            primary_phone: "",
            billing_email: "",
          },
        };

    return NextResponse.json({
      profile,
      countryCode: tenant?.country_code ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** PUT — update company profile for current tenant */
export async function PUT(req: NextRequest) {
  try {
    const { orgId } = await requireCrmApiAuth();

    const body = await req.json();
    const profile = body.profile as CompanyProfileData;
    const newCountryCode = body.countryCode as string | undefined;

    if (!profile) {
      return NextResponse.json(
        { error: "Missing profile data" },
        { status: 400 }
      );
    }

    // Update tenant country_code if changed
    if (newCountryCode && newCountryCode.length === 2) {
      await prisma.adm_tenants.update({
        where: { id: orgId },
        data: { country_code: newCountryCode },
      });
    }

    // Upsert the profile setting
    const existing = await prisma.adm_tenant_settings.findFirst({
      where: {
        tenant_id: orgId,
        category: PROFILE_CATEGORY,
        setting_key: PROFILE_KEY,
      },
    });

    if (existing) {
      await prisma.adm_tenant_settings.update({
        where: { id: existing.id },
        data: {
          setting_value: JSON.parse(
            JSON.stringify(profile)
          ) as Prisma.InputJsonValue,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.adm_tenant_settings.create({
        data: {
          tenant_id: orgId,
          category: PROFILE_CATEGORY,
          setting_key: PROFILE_KEY,
          setting_value: JSON.parse(
            JSON.stringify(profile)
          ) as Prisma.InputJsonValue,
        },
      });
    }

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_tenant_settings",
        entity_id: orgId,
        action: "update_company_profile",
        new_values: JSON.parse(
          JSON.stringify(profile)
        ) as Prisma.InputJsonValue,
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
