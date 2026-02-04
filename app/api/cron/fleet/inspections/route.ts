/**
 * Cron Worker: Vehicle Inspection Reminders
 *
 * Endpoint: GET /api/cron/fleet/inspections
 * Schedule: Daily at 7:00 AM (0 7 * * *)
 * Security: Protected by CRON_SECRET header
 *
 * Purpose: Send reminder emails for upcoming vehicle inspections (within 7 days)
 * Updates: Sets reminder_sent = true after notification is queued
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { URLS } from "@/lib/config/urls.config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/fleet/inspections
 *
 * Finds vehicle inspections due within the next 7 days where reminder_sent = false,
 * sends notification to fleet manager, and marks reminder_sent = true.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // SECURITY: Validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error({}, "CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn(
        { authHeader: authHeader ? "present but invalid" : "missing" },
        "Unauthorized cron request"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date range: today to 7 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find inspections due within 7 days where reminder not sent
    const upcomingInspections = await prisma.flt_vehicle_inspections.findMany({
      where: {
        scheduled_date: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        reminder_sent: false,
        status: {
          in: ["scheduled", "pending"],
        },
      },
      include: {
        flt_vehicles: {
          include: {
            dir_car_makes: true,
            dir_car_models: true,
            adm_tenants: {
              include: {
                clt_members: {
                  where: {
                    role: "admin",
                    deleted_at: null,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
      take: 50, // Process up to 50 per cron run
    });

    let processed = 0;
    let errors = 0;

    for (const inspection of upcomingInspections) {
      try {
        const vehicle = inspection.flt_vehicles;
        const tenant = vehicle.adm_tenants;
        const fleetManager = tenant.clt_members[0];

        if (!fleetManager) {
          logger.warn(
            { tenantId: tenant.id, inspectionId: inspection.id },
            "No fleet manager found for tenant, skipping inspection reminder"
          );
          continue;
        }

        // Calculate days remaining
        const scheduledDate = new Date(inspection.scheduled_date);
        const daysRemaining = Math.ceil(
          (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send notification
        await sendNotification(
          "fleet.vehicle.inspection_reminder",
          fleetManager.email,
          {
            fleet_manager_name: fleetManager.email.split("@")[0], // Use email prefix as name fallback
            vehicle_make: vehicle.dir_car_makes.name,
            vehicle_model: vehicle.dir_car_models.name,
            vehicle_plate: vehicle.license_plate,
            due_date: scheduledDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            days_remaining: daysRemaining.toString(),
            booking_link: `${URLS.app}/fleet/inspections/${inspection.id}`,
          },
          {
            tenantId: tenant.id,
            idempotencyKey: `inspection_reminder_${inspection.id}`,
          }
        );

        // Mark reminder as sent
        await prisma.flt_vehicle_inspections.update({
          where: { id: inspection.id },
          data: { reminder_sent: true },
        });

        processed++;
      } catch (error) {
        errors++;
        logger.error(
          {
            inspectionId: inspection.id,
            error: error instanceof Error ? error.message : "Unknown",
          },
          "Failed to process inspection reminder"
        );
      }
    }

    const duration = Date.now() - startTime;

    logger.info(
      {
        found: upcomingInspections.length,
        processed,
        errors,
        durationMs: duration,
      },
      "Cron: inspection reminders processed"
    );

    return NextResponse.json(
      {
        success: true,
        found: upcomingInspections.length,
        processed,
        errors,
        durationMs: duration,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - startTime;

    logger.error(
      {
        error: errorMessage,
        durationMs: duration,
      },
      "Cron: inspection reminders failed"
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs: duration,
      },
      { status: 500 }
    );
  }
}
