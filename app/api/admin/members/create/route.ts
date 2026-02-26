import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import { createMemberSchema } from "@/features/settings/schemas/member.schema";
import { sendNotification } from "@/lib/notifications";
import { buildAppUrl } from "@/lib/config/urls.config";
import { defaultLocale } from "@/lib/i18n/locales";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId: adminUserId, orgId } = await requireCrmApiAuth();

    const body = await req.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      tenantId,
      role,
      preferredLanguage,
      sendInvitation,
    } = parsed.data;

    // Check if member already exists for this email+tenant
    const existingMember = await prisma.adm_members.findFirst({
      where: {
        email: email.toLowerCase(),
        tenant_id: tenantId,
        deleted_at: null,
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "A member with this email already exists in this tenant" },
        { status: 409 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.auth_organization.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json(
        { error: "Selected tenant does not exist" },
        { status: 400 }
      );
    }

    // Create adm_members with status=pending and no auth_user_id
    const memberId = crypto.randomUUID();
    await prisma.adm_members.create({
      data: {
        id: memberId,
        tenant_id: tenantId,
        auth_user_id: null,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role,
        status: "pending",
        preferred_language: preferredLanguage || null,
      },
    });

    // Optionally create invitation and send email
    let invitationId: string | null = null;
    let emailSent = false;
    if (sendInvitation) {
      invitationId = crypto.randomUUID();
      const ttlMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const expiresAt = new Date(Date.now() + ttlMs);

      await prisma.auth_invitation.create({
        data: {
          id: invitationId,
          organization_id: tenantId,
          email: email.toLowerCase(),
          role: role === "admin" ? "org:adm_admin" : "member",
          status: "pending",
          expires_at: expiresAt,
          inviter_id: adminUserId,
          created_at: new Date(),
        },
      });

      // Fetch org + inviter names in parallel, then send email
      const [org, inviter] = await Promise.all([
        prisma.auth_organization.findUnique({
          where: { id: tenantId },
          select: { name: true },
        }),
        prisma.auth_user.findUnique({
          where: { id: adminUserId },
          select: { name: true },
        }),
      ]);

      const inviteUrl = buildAppUrl(
        `/${defaultLocale}/accept-invitation?id=${invitationId}`
      );
      const notifResult = await sendNotification(
        "admin.member.invitation",
        email.toLowerCase(),
        {
          inviter_name: inviter?.name ?? "Admin",
          tenant_name: org?.name ?? "FleetCore",
          invite_url: inviteUrl,
          expiry_days: "7",
        },
        {
          tenantId,
          idempotencyKey: `member_invitation_${invitationId}`,
          processImmediately: true,
        }
      );
      emailSent = notifResult.success;
    }

    // Audit log
    await prisma.adm_audit_logs.create({
      data: {
        tenant_id: orgId,
        entity: "adm_members",
        entity_id: memberId,
        action: "create_member",
        new_values: {
          email,
          firstName,
          lastName,
          role,
          tenantId,
          sendInvitation,
          createdBy: adminUserId,
        },
        severity: "info",
        category: "operational",
      },
    });

    return NextResponse.json({
      success: true,
      memberId,
      invitationId,
      emailSent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
