import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

/** GET /api/auth/check — Refine authProvider.check() server-side fallback */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ authenticated: !!session });
}
