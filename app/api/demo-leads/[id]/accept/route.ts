import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: leadId } = await params;

    // Transaction pour conversion lead → customer
    const result = await db.$transaction(async (tx) => {
      // 1. Récupérer le lead
      const lead = await tx.crm_leads.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        throw new Error("Lead not found");
      }

      if (lead.status === "accepted") {
        throw new Error("Lead already converted");
      }

      // 2. Créer l'organisation dans Clerk
      const clerk = await clerkClient();
      const clerkOrg = await clerk.organizations.createOrganization({
        name: lead.demo_company_name,
        slug: lead.demo_company_name.toLowerCase().replace(/\s+/g, "-"),
        publicMetadata: {
          country_code: lead.country_code,
          fleet_size: lead.fleet_size,
          lead_id: leadId,
        },
      });

      // 3. Inviter le lead comme admin
      await clerk.organizations.createOrganizationInvitation({
        organizationId: clerkOrg.id,
        emailAddress: lead.email,
        role: "admin",
        inviterUserId: userId,
      });

      // 4. Créer l'organisation dans notre DB
      const organization = await tx.adm_tenants.create({
        data: {
          name: lead.demo_company_name,
          subdomain: lead.demo_company_name.toLowerCase().replace(/\s+/g, "-"),
          country_code: lead.country_code,
          clerk_organization_id: clerkOrg.id,
        },
      });

      // 5. Mettre à jour le lead
      await tx.crm_leads.update({
        where: { id: leadId },
        data: {
          status: "accepted",
          qualified_date: new Date(),
          assigned_to: userId,
        },
      });

      // 6. Logger l'activité de conversion
      // TODO: Phase 2 - Add activity logging when sys_demo_lead_activity table is created
      // await tx.sys_demo_lead_activity.create({
      //   data: {
      //     lead_id: leadId,
      //     activity_type: "conversion",
      //     notes: `Lead converted to organization: ${clerkOrg.id}`,
      //     outcome: "accepted",
      //     performed_by: userId,
      //     status: "completed",
      //   },
      // });

      return {
        organization,
        clerkOrg,
        invitationSent: true,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error accepting lead:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
