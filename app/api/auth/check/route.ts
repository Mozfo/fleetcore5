import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/** GET /api/auth/check — Refine authProvider.check() server-side fallback */
export async function GET() {
  const { userId } = await auth();
  return NextResponse.json({ authenticated: !!userId });
}
