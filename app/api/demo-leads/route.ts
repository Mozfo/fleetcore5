import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { CountryService } from "@/lib/services/crm/country.service";
import { captureConsentIp } from "@/lib/middleware/gdpr.middleware";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation des champs requis
    if (
      !body.first_name ||
      !body.last_name ||
      !body.email ||
      !body.company_name ||
      !body.country_code ||
      !body.fleet_size
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Vérifier si email existe déjà
    const existingLead = await db.crm_leads.findFirst({
      where: { email: body.email.toLowerCase().trim() },
    });

    if (existingLead) {
      return NextResponse.json(
        { error: "A demo request with this email already exists" },
        { status: 409 }
      );
    }

    // 3. Validation GDPR (INLINE - pas de service layer)
    const countryService = new CountryService();
    const isGdprCountry = await countryService.isGdprCountry(body.country_code);

    if (isGdprCountry && !body.gdpr_consent) {
      return NextResponse.json(
        {
          error: "GDPR consent required for EU/EEA countries",
          code: "GDPR_CONSENT_REQUIRED",
          country_code: body.country_code,
        },
        { status: 400 }
      );
    }

    // 4. Capturer IP client (pour traçabilité GDPR)
    const consent_ip = captureConsentIp(request);

    // 5. Normaliser les données
    const normalizedEmail = body.email.toLowerCase().trim();
    const normalizedFirstName = body.first_name.trim();
    const normalizedLastName = body.last_name.trim();
    const normalizedCompanyName = body.company_name.trim();
    const countryCode = body.country_code.toUpperCase().trim();

    // 6. Créer le lead DIRECTEMENT (pas de LeadCreationService)
    const lead = await db.crm_leads.create({
      data: {
        // Données du formulaire
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        company_name: normalizedCompanyName,
        fleet_size: body.fleet_size,
        phone: body.phone?.trim() || null,
        message: body.message?.trim() || null,
        country_code: countryCode,

        // Statut initial
        status: "new",
        lead_stage: "top_of_funnel",

        // GDPR compliance
        gdpr_consent: body.gdpr_consent || null,
        consent_ip: body.gdpr_consent ? consent_ip : null,
        consent_at: body.gdpr_consent ? new Date() : null,

        // Métadonnées
        metadata: {
          source: "request_demo_form",
          form_locale: body.form_locale || "en",
          submitted_at: new Date().toISOString(),
        },
      },
    });

    // 7. Log succès
    logger.info(
      {
        leadId: lead.id,
        email: normalizedEmail,
        countryCode,
      },
      "[Demo Lead] Created successfully"
    );

    // 8. Retourner succès
    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      message: "Demo request submitted successfully",
    });
  } catch (error) {
    logger.error({ error }, "[Demo Lead] Error creating lead");

    // Gestion erreur Prisma unique constraint
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A demo request with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit demo request. Please try again." },
      { status: 500 }
    );
  }
}

// GET - Liste des demo leads (pour admin, si nécessaire)
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
