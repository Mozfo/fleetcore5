import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { createInvitationSchema } from "@/features/settings/schemas/invitation.schema";
import type {
  SettingsInvitation,
  SettingsInvitationsResponse,
} from "@/features/settings/types/invitation.types";

export const dynamic = "force-dynamic";

/** GET — list all invitations */
export async function GET() {
  try {
    await requireCrmApiAuth();

    const invitations = await prisma.auth_invitation.findMany({
      orderBy: { created_at: "desc" },
      include: {
        organization: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
    });

    const data: SettingsInvitation[] = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      organizationId: inv.organization_id,
      organizationName: inv.organization.name,
      inviterName: inv.user.name,
      expiresAt: inv.expires_at.toISOString(),
      createdAt: inv.created_at.toISOString(),
    }));

    const response: SettingsInvitationsResponse = { data, total: data.length };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/** POST — create invitation via Prisma (same pattern as seed-auth.ts & auth.service.ts) */
export async function POST(req: NextRequest) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();

    const body = await req.json();
    const parsed = createInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, organizationId, role } = parsed.data;

    // Check if there's already a pending invitation for this email+org
    const existing = await prisma.auth_invitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organization_id: organizationId,
        status: "pending",
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 409 }
      );
    }

    // Create invitation directly via Prisma
    // TODO: Replace with auth.api.createInvitation() when Better Auth
    // organization API supports server-side invitation without type issues.
    const invId = crypto.randomUUID();
    const ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const expiresAt = new Date(Date.now() + ttlMs);

    await prisma.auth_invitation.create({
      data: {
        id: invId,
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        status: "pending",
        expires_at: expiresAt,
        inviter_id: adminUserId,
        created_at: new Date(),
      },
    });

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "auth_invitation",
        entity_id: invId,
        action: "create_invitation",
        new_values: { email, organizationId, role },
        severity: "info",
        category: "operational",
      },
    });

    return NextResponse.json({ success: true, invitationId: invId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
