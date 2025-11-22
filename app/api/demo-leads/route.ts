import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { getTemplateLocale } from "@/lib/utils/locale-mapping";

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
        country_preposition_fr: true,
        country_preposition_en: true,
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

    // 2. Check if lead already exists
    const existingLead = await db.crm_leads.findFirst({
      where: {
        email: body.email,
        deleted_at: null,
      },
    });

    if (existingLead) {
      logger.info(
        { email: body.email, leadId: existingLead.id },
        "Duplicate lead submission - returning 409"
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_EMAIL",
            message: "Email already registered",
            params: {
              supportEmail: "support@fleetcore.io",
            },
          },
        },
        { status: 409 }
      );
    }

    // 3. Create lead
    const lead = await db.crm_leads.create({
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        company_name: body.company_name,
        fleet_size: body.fleet_size,
        phone: body.phone || null,
        message: body.message,
        country_code: countryCode,
        status: "new",
      },
    });

    // 3. Send appropriate email based on operational status
    const notificationService = new NotificationService(db);
    const templateCode = country.is_operational
      ? "lead_confirmation"
      : "expansion_opportunity";

    try {
      // Map form locale to template locale using database configuration
      const templateLocale = await getTemplateLocale(body.form_locale || "en");

      // ✨ FIX: Send preposition and country name separately
      // This allows templates to style only the country name (not the preposition)
      const countryPreposition =
        templateLocale === "fr"
          ? country.country_preposition_fr
          : templateLocale === "ar"
            ? "" // Arabic doesn't use prepositions like EN/FR
            : country.country_preposition_en;

      const countryName =
        templateLocale === "fr"
          ? country.country_name_fr
          : templateLocale === "ar"
            ? country.country_name_ar
            : country.country_name_en;

      const emailResult = await notificationService.sendEmail({
        recipientEmail: body.email,
        templateCode: templateCode,
        locale: templateLocale, // Explicit locale from form (CASCADE_3_PARAMS)
        variables: {
          first_name: body.first_name,
          company_name: body.company_name,
          fleet_size: body.fleet_size,
          country_preposition: countryPreposition,
          country_name: countryName,
          phone: body.phone || null,
          message: body.message || null,
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
      const emailErrorMessage =
        emailError instanceof Error ? emailError.message : String(emailError);
      logger.error(
        { errorMessage: emailErrorMessage, leadId: lead.id },
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ errorMessage }, "Error creating lead");
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error({ errorMessage }, "Error fetching leads");
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
