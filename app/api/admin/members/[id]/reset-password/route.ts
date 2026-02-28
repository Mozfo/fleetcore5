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

    // Resolve auth_user via adm_members (id param is adm_members.id)
    const member = await prisma.adm_members.findFirst({
      where: { id, deleted_at: null },
      select: { auth_user_id: true, email: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify linked auth account exists
    const authUserId = member.auth_user_id;
    if (!authUserId) {
      return NextResponse.json(
        { error: "Member has no auth account. They must sign up first." },
        { status: 422 }
      );
    }

    const user = await prisma.auth_user.findUnique({
      where: { id: authUserId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Auth account not found for this member" },
        { status: 404 }
      );
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
