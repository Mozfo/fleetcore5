import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// POST - Créer un nouveau lead
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lead = await db.crm_leads.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        demo_company_name: body.company_name,
        fleet_size: body.company_size,
        phone: body.phone,
        message: body.message,
        country_code: body.country_code || "AE",
        status: "new",
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    logger.error({ error }, "Error creating lead");
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

// GET - Lister les leads
export async function GET() {
  try {
    const leads = await db.crm_leads.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    logger.error({ error }, "Error fetching leads");
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
