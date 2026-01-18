import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

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
      // V6.3: Si outcome décisif, update le lead (qualified → proposal_sent)
      if (["proposal_sent", "converted", "lost"].includes(body.outcome)) {
        await tx.crm_leads.update({
          where: { id: leadId },
          data: {
            status: body.outcome,
            assigned_to: userId,
            converted_date:
              body.outcome === "converted" ? new Date() : undefined,
          },
        });
      }

      return {
        message: "Activity recorded (Phase 1 - activity table pending)",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Error creating activity");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
