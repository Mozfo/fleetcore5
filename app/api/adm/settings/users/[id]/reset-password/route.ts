import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a random temporary password
    const tempPassword =
      "Temp" +
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      "!";

    // Reset via Better Auth admin API
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        userId: id,
        newPassword: tempPassword,
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
      tempPassword,
      message: "Password reset. Share the temporary password securely.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
