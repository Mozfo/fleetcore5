import { NextResponse } from "next/server";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { prisma } from "@/lib/prisma";
import type {
  SettingsUser,
  SettingsUsersResponse,
} from "@/features/settings/types/user.types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCrmApiAuth();

    const users = await prisma.auth_user.findMany({
      orderBy: { created_at: "desc" },
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

    const data: SettingsUser[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.email_verified,
      image: u.image,
      role: u.role,
      banned: u.banned ?? false,
      banReason: u.ban_reason,
      createdAt: u.created_at.toISOString(),
      memberships: u.members.map((m) => ({
        organizationId: m.organization_id,
        organizationName: m.organization.name,
        role: m.role,
      })),
    }));

    const response: SettingsUsersResponse = { data, total: data.length };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("AUTH:") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
