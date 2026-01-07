import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { CountryService } from "@/lib/services/crm/country.service";
import { captureConsentIp } from "@/lib/middleware/gdpr.middleware";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { getTemplateLocale } from "@/lib/utils/locale-mapping";
import { EmailVerificationService } from "@/lib/services/crm/email-verification.service";

// ===== ZOD SCHEMAS =====

/**
 * Schema for wizard_step1 mode (email verification only)
 * V6.2.2 Book Demo Wizard - Step 1
 */
const WizardStep1Schema = z.object({
  mode: z.literal("wizard_step1"),
  email: z.string().email("Invalid email format"),
  locale: z.string().optional().default("en"),
});

/**
 * Schema for full_form mode (legacy behavior)
 * This is the existing request demo form
 */
const FullFormSchema = z.object({
  mode: z.literal("full_form").optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  company_name: z.string().min(1, "Company name is required"),
  country_code: z.string().min(2, "Country code is required"),
  fleet_size: z.string().min(1, "Fleet size is required"),
  phone: z.string().optional(),
  message: z.string().optional(),
  gdpr_consent: z.boolean().optional(),
  form_locale: z.string().optional(),
});

/**
 * Discriminated union for request body (type documentation)
 * Determines mode based on presence of 'mode' field
 * Note: Individual schemas used for validation, this union for type inference
 */
const _RequestBodySchema = z.discriminatedUnion("mode", [
  WizardStep1Schema,
  FullFormSchema.extend({ mode: z.literal("full_form") }),
]);
// Export type for external use if needed
export type RequestBody = z.infer<typeof _RequestBodySchema>;

// Type for parsed bodies
type WizardStep1Body = z.infer<typeof WizardStep1Schema>;
type FullFormBody = z.infer<typeof FullFormSchema>;

// ===== HANDLERS =====

/**
 * Handle wizard_step1 mode - Email verification only
 * Creates lead with email only and sends 6-digit verification code
 */
async function handleWizardStep1(body: WizardStep1Body): Promise<NextResponse> {
  const normalizedEmail = body.email.toLowerCase().trim();
  const locale = body.locale || "en";

  // Check for existing lead
  const existingLead = await db.crm_leads.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
      deleted_at: null,
    },
    select: {
      id: true,
      email_verified: true,
      status: true,
    },
  });

  // Case 1: Lead exists and is converted
  if (existingLead && existingLead.status === "converted") {
    logger.info(
      { email: normalizedEmail, leadId: existingLead.id },
      "[Wizard Step1] Lead already converted"
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ALREADY_CONVERTED",
          message: "This email is already associated with a FleetCore account",
        },
      },
      { status: 409 }
    );
  }

  // Case 2: Lead exists and email is already verified
  if (existingLead && existingLead.email_verified) {
    logger.info(
      { email: normalizedEmail, leadId: existingLead.id },
      "[Wizard Step1] Email already verified"
    );
    return NextResponse.json({
      success: true,
      leadId: existingLead.id,
      alreadyVerified: true,
      message: "Email already verified. You can proceed to the next step.",
    });
  }

  // Case 3: Lead exists but not verified - resend code
  // Case 4: New lead - will be created by EmailVerificationService

  // Send verification code (creates lead if needed)
  const emailVerificationService = new EmailVerificationService(db);
  const result = await emailVerificationService.sendVerificationCode({
    email: normalizedEmail,
    locale,
  });

  if (!result.success) {
    // Handle rate limiting
    if (result.error === "rate_limited" && result.retryAfter) {
      logger.info(
        { email: normalizedEmail, retryAfter: result.retryAfter },
        "[Wizard Step1] Rate limited"
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Please wait before requesting another code",
            retryAfter: result.retryAfter,
          },
        },
        { status: 429 }
      );
    }

    // Other errors
    logger.error(
      { email: normalizedEmail, error: result.error },
      "[Wizard Step1] Failed to send verification code"
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEND_FAILED",
          message: "Failed to send verification code. Please try again.",
        },
      },
      { status: 500 }
    );
  }

  logger.info(
    { email: normalizedEmail, leadId: result.leadId },
    "[Wizard Step1] Verification code sent"
  );

  return NextResponse.json({
    success: true,
    leadId: result.leadId,
    requiresVerification: true,
    expiresAt: result.expiresAt?.toISOString(),
    message: "Verification code sent to your email",
  });
}

/**
 * Handle full_form mode - Legacy request demo form
 * Creates lead with all details and queues confirmation email
 */
async function handleFullForm(
  request: NextRequest,
  body: FullFormBody
): Promise<NextResponse> {
  // 1. Vérifier si email existe déjà (exclude soft-deleted)
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

  // 2. Récupérer les infos du pays (pour GDPR + email)
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

  // 3. Validation GDPR (INLINE - pas de service layer)
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
}

// ===== MAIN HANDLER =====

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine mode: explicit mode field OR infer from payload structure
    const mode = body.mode || "full_form";

    if (mode === "wizard_step1") {
      // Validate wizard_step1 schema
      const parseResult = WizardStep1Schema.safeParse(body);
      if (!parseResult.success) {
        const errors = parseResult.error.flatten();
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request body",
              details: errors.fieldErrors,
            },
          },
          { status: 400 }
        );
      }

      return handleWizardStep1(parseResult.data);
    }

    // Default: full_form mode (legacy behavior)
    // Manual validation to maintain backward compatibility
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

    // Validate with Zod for type safety
    const parseResult = FullFormSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten();
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: errors.fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    return handleFullForm(request, parseResult.data);
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
