import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// POST - Créer un nouveau lead
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const lead = await prisma.sys_demo_lead.create({
      data: {
        full_name: body.full_name,
        email: body.email,
        demo_company_name: body.demo_company_name,
        fleet_size: body.fleet_size,
        phone: body.phone,
        message: body.message,
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
    const leads = await prisma.sys_demo_lead.findMany({
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
