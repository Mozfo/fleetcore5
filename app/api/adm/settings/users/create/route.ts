import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { createUserSchema } from "@/features/settings/schemas/user.schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, name, password, role } = parsed.data;

    // Check if email already exists
    const existing = await prisma.auth_user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create user via Better Auth admin API
    const result = await auth.api.createUser({
      headers: await headers(),
      body: {
        email,
        name,
        password,
        role,
      },
    });

    if (!result?.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const newUserId = result.user.id;

    // Add user as member of the HQ org
    await prisma.auth_member.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: orgId,
        user_id: newUserId,
        role: role === "admin" ? "org:adm_admin" : "member",
        created_at: new Date(),
      },
    });

    // Sync to clt_members (same logic as afterAcceptInvitation hook)
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || null;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    await prisma.clt_members.create({
      data: {
        tenant_id: orgId,
        auth_user_id: newUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: role === "admin" ? "admin" : "member",
        status: "active",
      },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "auth_user",
        entity_id: newUserId,
        action: "create_user",
        new_values: { email, name, role, createdBy: adminUserId },
        severity: "info",
        category: "operational",
      },
    });

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
