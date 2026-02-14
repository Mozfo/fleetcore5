import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

/** GET /api/auth/identity — Refine authProvider.getIdentity() server-side fallback */
export async function GET() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) {
    return NextResponse.json(null, { status: 401 });
  }

  const user = await currentUser();

  return NextResponse.json({
    id: userId,
    name: user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : "Unknown",
    email: user?.emailAddresses?.[0]?.emailAddress ?? undefined,
    avatar: user?.imageUrl,
    orgId,
    orgRole,
  });
}
