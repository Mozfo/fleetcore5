import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// POST - Créer un nouveau lead
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lead = await db.crm_leads.create({
      data: {
        full_name: body.full_name,
        email: body.email,
        demo_company_name: body.demo_company_name,
        fleet_size: body.fleet_size,
        phone: body.phone,
        message: body.message,
        country_code: body.country_code || "AE",
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Error creating lead:", error);
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
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
