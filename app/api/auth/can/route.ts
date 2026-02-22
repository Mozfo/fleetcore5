import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { hasPermission, type OrgRole } from "@/lib/config/permissions";
import {
  RESOURCE_TO_MODULE,
  ACTION_TO_PERMISSION,
} from "@/lib/config/refine-mappings";

/** POST /api/auth/can — Refine accessControlProvider.can() server-side fallback */
export async function POST(request: NextRequest) {
  const session = await getSession();
  const orgRole = session?.orgRole ?? null;

  const { resource, action } = (await request.json()) as {
    resource?: string;
    action?: string;
  };

  const mod = resource ? RESOURCE_TO_MODULE[resource] : undefined;
  const permAction = action ? ACTION_TO_PERMISSION[action] : undefined;

  if (!mod || !permAction) {
    return NextResponse.json({
      can: false,
      reason: "Unknown resource or action",
    });
  }

  const allowed = hasPermission(orgRole as OrgRole, `${mod}:${permAction}`);
  return NextResponse.json(
    allowed ? { can: true } : { can: false, reason: "Insufficient permissions" }
  );
}
