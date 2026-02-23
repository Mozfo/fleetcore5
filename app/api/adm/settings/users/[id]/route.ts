import { NextResponse, type NextRequest } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import type { SettingsUser } from "@/features/settings/types/user.types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireCrmApiAuth();
    const { id } = await params;

    const user = await prisma.auth_user.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: SettingsUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.email_verified,
      image: user.image,
      role: user.role,
      banned: user.banned ?? false,
      banReason: user.ban_reason,
      createdAt: user.created_at.toISOString(),
      memberships: user.members.map((m) => ({
        organizationId: m.organization_id,
        organizationName: m.organization.name,
        role: m.role,
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
