/**
 * POST /api/crm/leads/send-reschedule-link
 *
 * V6.2.4 - Send reschedule/cancel link to lead's email
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
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.fleetcore.io";

const requestSchema = z.object({
  email: z.string().email("Invalid email format"),
  locale: z.enum(["en", "fr"]).optional().default("en"),
});

// Simple translations for the email
const translations = {
  en: {
    subject: "Modify or Cancel Your FleetCore Demo",
    greeting: "Hello",
    message:
      "You requested to modify or cancel your scheduled demo with FleetCore.",
    clickBelow: "Click the button below to reschedule or cancel your booking:",
    buttonText: "Modify My Booking",
    notYou:
      "If you didn't request this, you can safely ignore this email. Your booking will remain unchanged.",
    regards: "Best regards,",
    team: "The FleetCore Team",
  },
  fr: {
    subject: "Modifier ou annuler votre démo FleetCore",
    greeting: "Bonjour",
    message:
      "Vous avez demandé à modifier ou annuler votre démo planifiée avec FleetCore.",
    clickBelow:
      "Cliquez sur le bouton ci-dessous pour reprogrammer ou annuler votre réservation :",
    buttonText: "Modifier ma réservation",
    notYou:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email. Votre réservation restera inchangée.",
    regards: "Cordialement,",
    team: "L'équipe FleetCore",
  },
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
    const t = translations[locale];

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

    // Generate FleetCore reschedule URL (stays on our domain)
    const rescheduleUrl = `${APP_URL}/${locale}/book-demo/reschedule?uid=${lead.booking_calcom_uid}`;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `FleetCore <${process.env.RESEND_FROM_EMAIL || "noreply@fleetcore.io"}>`,
      to: [lead.email],
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/dillqmyh7/image/upload/v1763024908/fleetcore-logo_ljrtyn.jpg" alt="FleetCore" style="height: 40px;">
          </div>

          <h2 style="color: #1e3a5f; margin-bottom: 20px;">${t.greeting}${lead.first_name ? ` ${lead.first_name}` : ""},</h2>

          <p style="margin-bottom: 20px;">${t.message}</p>

          <p style="margin-bottom: 25px;">${t.clickBelow}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${rescheduleUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ${t.buttonText}
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            ${t.notYou}
          </p>

          <p style="margin-top: 30px;">
            ${t.regards}<br>
            <strong>${t.team}</strong>
          </p>
        </body>
        </html>
      `,
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
