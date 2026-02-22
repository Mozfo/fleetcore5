import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

/** GET /api/auth/identity — Refine authProvider.getIdentity() server-side fallback */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  const { userId, orgId, orgRole, user } = session;

  return NextResponse.json({
    id: userId,
    name: user.name || "Unknown",
    email: user.email || undefined,
    avatar: user.image,
    orgId,
    orgRole,
  });
}
