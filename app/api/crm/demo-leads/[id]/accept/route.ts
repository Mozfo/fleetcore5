import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;
    const { id: leadId } = await params;

    // Transaction pour conversion lead -> customer
    const result = await db.$transaction(async (tx) => {
      // 1. Recuperer le lead
      const lead = await tx.crm_leads.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error("Lead not found");
      }

      if (lead.status === "converted") {
        throw new Error("Lead already converted");
      }

      // 2. Creer l'organisation dans auth_organization (Better Auth)
      const orgId = crypto.randomUUID();
      const orgName = lead.company_name || "Unnamed Company";
      const orgSlug = (lead.company_name || "unnamed-company")
        .toLowerCase()
        .replace(/\s+/g, "-");

      const metadataPayload = JSON.stringify({
        country_code: lead.country_code,
        fleet_size: lead.fleet_size,
        lead_id: leadId,
      });

      await tx.auth_organization.create({
        data: {
          id: orgId,
          name: orgName,
          slug: orgSlug,
          metadata: metadataPayload,
          created_at: new Date(),
        },
      });

      // 3. Creer l'invitation admin via auth_invitation
      const invitationId = crypto.randomUUID();
      const invitationExpiryMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const expiresAt = new Date(Date.now() + invitationExpiryMs);

      await tx.auth_invitation.create({
        data: {
          id: invitationId,
          organization_id: orgId,
          email: lead.email,
          role: "admin",
          status: "pending",
          expires_at: expiresAt,
          inviter_id: userId,
          created_at: new Date(),
        },
      });

      // 4. Creer l'organisation dans notre DB (adm_tenants)
      const organization = await tx.adm_tenants.create({
        data: {
          name: orgName,
          country_code: lead.country_code || "AE",
          default_currency: "AED",
        },
      });

      // 5. Mettre a jour le lead
      await tx.crm_leads.update({
        where: { id: leadId },
        data: {
          status: "converted",
          converted_date: new Date(),
          assigned_to: userId,
        },
      });

      // 6. Logger l'activite de conversion
      // TODO: Phase 2 - Add activity logging when sys_demo_lead_activity table is created

      return {
        organization,
        authOrgId: orgId,
        invitationSent: true,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Error accepting lead");
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
