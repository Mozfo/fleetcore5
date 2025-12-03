import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { CountryService } from "@/lib/services/crm/country.service";
import { captureConsentIp } from "@/lib/middleware/gdpr.middleware";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { getTemplateLocale } from "@/lib/utils/locale-mapping";

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

    // 2. Vérifier si email existe déjà (exclude soft-deleted)
    const existingLead = await db.crm_leads.findFirst({
      where: {
        email: body.email.toLowerCase().trim(),
        deleted_at: null,
      },
    });

    if (existingLead) {
      logger.info(
        { email: body.email.toLowerCase().trim(), leadId: existingLead.id },
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

    // 3. Récupérer les infos du pays (pour GDPR + email)
    const country = await db.crm_countries.findUnique({
      where: { country_code: body.country_code.toUpperCase().trim() },
      select: {
        country_code: true,
        is_operational: true,
        country_gdpr: true,
        country_name_en: true,
        country_name_fr: true,
        country_name_ar: true,
        country_preposition_fr: true,
        country_preposition_en: true,
      },
    });

    if (!country) {
      logger.warn(
        { countryCode: body.country_code },
        "[Demo Lead] Country not found"
      );
      return NextResponse.json(
        { error: "Country not supported" },
        { status: 400 }
      );
    }

    // 4. Validation GDPR (INLINE - pas de service layer)
    const countryService = new CountryService();
    const isGdprCountry =
      country.country_gdpr ??
      (await countryService.isGdprCountry(body.country_code));

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

    // 7. ⚠️ CRITICAL BUSINESS LOGIC - DO NOT REMOVE
    // This code queues confirmation emails to leads after form submission.
    // INCIDENT HISTORY: Session #27 (24 nov 2025) - Code accidentally removed
    // PROTECTED BY: Critical path test + pre-commit hook
    // ARCHITECTURE: Session #29 - Migrated to Transactional Outbox Pattern (queue)
    const queueService = new NotificationQueueService(db);
    const templateCode = country.is_operational
      ? "lead_confirmation"
      : "expansion_opportunity";

    // Map form locale to template locale
    const templateLocale = await getTemplateLocale(body.form_locale || "en");

    // Get country preposition and name based on locale
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

    // Queue notification (will be processed by cron worker)
    const queueResult = await queueService.queueNotification({
      templateCode: templateCode,
      recipientEmail: normalizedEmail,
      locale: templateLocale,
      variables: {
        first_name: normalizedFirstName,
        company_name: normalizedCompanyName,
        fleet_size: body.fleet_size,
        country_preposition: countryPreposition,
        country_name: countryName,
        phone: body.phone?.trim() || null,
        message: body.message?.trim() || null,
      },
      leadId: lead.id,
      countryCode: countryCode,
      // Idempotency key prevents duplicate emails if form is submitted twice
      idempotencyKey: `lead_${lead.id}_${templateCode}`,
    });

    logger.info(
      {
        leadId: lead.id,
        email: normalizedEmail,
        countryCode,
        templateCode,
        isOperational: country.is_operational,
        locale: templateLocale,
        queued: queueResult.success,
        queueId: queueResult.queueId,
      },
      `[Demo Lead] Created successfully and ${templateCode} email queued`
    );

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      message: "Demo request submitted successfully",
      notification: {
        queued: queueResult.success,
        template: templateCode,
        locale: templateLocale,
      },
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
