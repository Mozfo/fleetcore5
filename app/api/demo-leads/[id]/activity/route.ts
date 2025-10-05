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

    const result = await db.$transaction(async (tx) => {
      // 1. Créer l'activité
      const activity = await tx.sys_demo_lead_activity.create({
        data: {
          lead_id: leadId,
          activity_type: body.activity_type,
          notes: body.notes,
          outcome: body.outcome,
          duration: body.duration,
          priority: body.priority || "medium",
          status: body.status || "completed",
          performed_by: userId,
          next_action: body.next_action,
          next_action_date: body.next_action_date
            ? new Date(body.next_action_date)
            : null,
        },
      });

      // 2. Si outcome décisif, update le lead
      if (["qualified", "accepted", "refused"].includes(body.outcome)) {
        await tx.sys_demo_lead.update({
          where: { id: leadId },
          data: {
            status: body.outcome,
            assigned_to: userId,
            qualified_date:
              body.outcome === "accepted" ? new Date() : undefined,
          },
        });
      }

      return activity;
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
