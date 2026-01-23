/**
 * POST /api/crm/leads/send-reschedule-link
 *
 * V6.2.4 - Send reschedule/cancel link to lead's email
 * V6.3.3 - iOS Mail compatible short URLs
 * V6.6 - Migrated to use ModifyBookingRequest template
 *
 * Security:
 * - No direct modification on the site
 * - Modification only via link sent to email owner
 * - Uses Cal.com reschedule link (booking_calcom_uid)
 *
 * @module app/api/crm/leads/send-reschedule-link/route
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { generateShortToken } from "@/lib/utils/token";
import { EMAIL_FROM } from "@/lib/config/email.config";
import { ModifyBookingRequest } from "@/emails/templates/ModifyBookingRequest";

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  email: z.string().email("Invalid email format"),
  locale: z.enum(["en", "fr"]).optional().default("en"),
});

// Subject translations
const subjects = {
  en: "Modify or Cancel Your FleetCore Demo",
  fr: "Modifier ou annuler votre démo FleetCore",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { email, locale } = validationResult.data;

    // Find lead by email with booking
    const lead = await prisma.crm_leads.findFirst({
      where: {
        email: { equals: email.toLowerCase().trim(), mode: "insensitive" },
        deleted_at: null,
        booking_calcom_uid: { not: null },
        booking_slot_at: { not: null },
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        booking_calcom_uid: true,
        booking_slot_at: true,
        reschedule_token: true,
      },
    });

    if (!lead || !lead.booking_calcom_uid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_BOOKING_FOUND",
            message: "No booking found for this email",
          },
        },
        { status: 404 }
      );
    }

    // V6.3.3: Generate or reuse short token for iOS Mail compatibility
    let rescheduleToken = lead.reschedule_token;
    if (!rescheduleToken) {
      rescheduleToken = generateShortToken();
      await prisma.crm_leads.update({
        where: { id: lead.id },
        data: { reschedule_token: rescheduleToken },
      });
    }

    // Generate short URL for iOS Mail compatibility (~28 chars vs 88)
    // /r/[token] redirects to /[locale]/book-demo/reschedule?uid=[calcom_uid]
    const rescheduleUrl = `https://fleetcore.io/${locale}/r/${rescheduleToken}`;

    // Render email using template
    const html = await render(
      ModifyBookingRequest({
        locale,
        firstName: lead.first_name || undefined,
        rescheduleUrl,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [lead.email],
      subject: subjects[locale],
      html,
    });

    if (error) {
      logger.error(
        { email, error },
        "[SendRescheduleLink] Failed to send email"
      );

      // Check if it's a Resend domain verification error (dev mode limitation)
      const isResendTestingError =
        error.message?.includes("testing emails") ||
        error.message?.includes("verify a domain");

      return NextResponse.json(
        {
          success: false,
          error: {
            code: isResendTestingError
              ? "RESEND_TESTING_MODE"
              : "EMAIL_SEND_FAILED",
            message: isResendTestingError
              ? "Email service in testing mode. Domain verification required for external emails."
              : "Failed to send email",
          },
        },
        { status: isResendTestingError ? 400 : 500 }
      );
    }

    // Log activity
    await prisma.crm_lead_activities.create({
      data: {
        lead_id: lead.id,
        activity_type: "email_sent",
        title: "Reschedule link sent",
        description: `Reschedule/cancel link sent to ${lead.email}`,
        metadata: {
          email_id: data?.id,
          reschedule_url: rescheduleUrl,
        },
        performed_by_name: "System",
        is_completed: true,
        completed_at: new Date(),
      },
    });

    logger.info(
      {
        email: lead.email,
        leadId: lead.id,
        emailId: data?.id,
      },
      "[SendRescheduleLink] Reschedule link sent successfully"
    );

    return NextResponse.json({
      success: true,
      message: "Reschedule link sent to email",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[SendRescheduleLink] Failed to process request"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to send reschedule link",
        },
      },
      { status: 500 }
    );
  }
}
