import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { buildAppUrl } from "@/lib/config/urls.config";
import { defaultLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();
    const { id } = await params;

    // Verify user exists
    const user = await prisma.auth_user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Send password reset email via Better Auth (triggers sendResetPassword hook → Resend)
    const redirectTo = buildAppUrl(`/${defaultLocale}/reset-password`);

    await auth.api.requestPasswordReset({
      headers: await headers(),
      body: {
        email: user.email,
        redirectTo,
      },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "auth_user",
        entity_id: id,
        action: "reset_password",
        new_values: { targetEmail: user.email, performedBy: adminUserId },
        severity: "warning",
        category: "security",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset email sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
