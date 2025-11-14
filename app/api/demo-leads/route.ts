import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { NotificationService } from "@/lib/services/notification/notification.service";

// POST - Créer un nouveau lead
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const countryCode = body.country_code || "AE";

    // 1. Check if country is operational
    const country = await db.crm_countries.findUnique({
      where: { country_code: countryCode },
      select: {
        country_code: true,
        is_operational: true,
        country_name_en: true,
        country_name_fr: true,
        country_name_ar: true,
        notification_locale: true,
      },
    });

    if (!country) {
      logger.warn({ countryCode }, "Country not found in crm_countries");
      return NextResponse.json(
        { error: "Country not supported" },
        { status: 400 }
      );
    }

    // 2. Create lead
    const lead = await db.crm_leads.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        demo_company_name: body.company_name,
        fleet_size: body.company_size,
        phone: body.phone,
        message: body.message,
        country_code: countryCode,
        status: "new",
      },
    });

    // 3. Send appropriate email based on operational status
    const notificationService = new NotificationService();
    const templateCode = country.is_operational
      ? "lead_confirmation"
      : "expansion_opportunity";

    try {
      const emailResult = await notificationService.sendEmail({
        recipientEmail: body.email,
        templateCode: templateCode,
        variables: {
          first_name: body.first_name,
          company_name: body.company_name,
          fleet_size: body.company_size,
          country_name: country.country_name_en, // Will use cascade for locale
        },
        leadId: lead.id,
        countryCode: countryCode,
        fallbackLocale: "en",
      });

      logger.info(
        {
          leadId: lead.id,
          templateCode,
          isOperational: country.is_operational,
          locale: emailResult.locale,
          success: emailResult.success,
        },
        `Lead created and ${templateCode} email sent`
      );

      return NextResponse.json({
        success: true,
        data: {
          lead,
          email: {
            sent: emailResult.success,
            template: templateCode,
            locale: emailResult.locale,
          },
        },
      });
    } catch (emailError) {
      // Lead created but email failed - log and continue
      logger.error(
        { error: emailError, leadId: lead.id },
        "Email sending failed"
      );
      return NextResponse.json({
        success: true,
        data: {
          lead,
          email: {
            sent: false,
            error: "Email notification failed",
          },
        },
      });
    }
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
