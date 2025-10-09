import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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
    const body = await request.json();

    // TODO: Phase 2 - Activity logging will be implemented when sys_demo_lead_activity table is created
    const result = await db.$transaction(async (tx) => {
      // Si outcome décisif, update le lead
      if (["qualified", "accepted", "refused"].includes(body.outcome)) {
        await tx.crm_leads.update({
          where: { id: leadId },
          data: {
            status: body.outcome,
            assigned_to: userId,
            converted_at: body.outcome === "accepted" ? new Date() : undefined,
          },
        });
      }

      return {
        message: "Activity recorded (Phase 1 - activity table pending)",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
