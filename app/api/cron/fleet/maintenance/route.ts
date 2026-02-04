/**
 * Cron Worker: Maintenance Scheduled Notifications
 *
 * Endpoint: GET /api/cron/fleet/maintenance
 * Schedule: Daily at 6:00 AM (0 6 * * *)
 * Security: Protected by CRON_SECRET header
 *
 * Purpose: Send notifications to drivers for maintenance scheduled today or tomorrow
 * Updates: Adds notification_sent flag in metadata after notification is queued
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { URLS } from "@/lib/config/urls.config";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/fleet/maintenance
 *
 * Finds vehicle maintenance scheduled for today or tomorrow where notification not sent,
 * sends notification to assigned driver, and marks notification_sent in metadata.
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

    // Calculate date range: today and tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Find maintenance scheduled for today or tomorrow
    const upcomingMaintenance = await prisma.flt_vehicle_maintenance.findMany({
      where: {
        scheduled_date: {
          gte: today,
          lt: dayAfterTomorrow,
        },
        status: "scheduled",
        deleted_at: null,
      },
      take: 50, // Process up to 50 per cron run
    });

    let processed = 0;
    let errors = 0;
    let skipped = 0;

    for (const maintenance of upcomingMaintenance) {
      try {
        // Check if notification already sent (stored in metadata)
        const metadata = (maintenance.metadata as Prisma.JsonObject) || {};
        if (metadata.notification_sent === true) {
          skipped++;
          continue;
        }

        // Fetch vehicle with related data
        const vehicle = await prisma.flt_vehicles.findUnique({
          where: { id: maintenance.vehicle_id },
          include: {
            dir_car_makes: true,
            dir_car_models: true,
            adm_tenants: true,
          },
        });

        if (!vehicle) {
          logger.warn(
            {
              maintenanceId: maintenance.id,
              vehicleId: maintenance.vehicle_id,
            },
            "Vehicle not found for maintenance, skipping notification"
          );
          skipped++;
          continue;
        }

        // Get active driver assignment for this vehicle
        const assignment = await prisma.flt_vehicle_assignments.findFirst({
          where: {
            vehicle_id: vehicle.id,
            status: "active",
            deleted_at: null,
          },
          include: {
            rid_drivers: true,
          },
        });

        const tenant = vehicle.adm_tenants;

        if (!assignment || !assignment.rid_drivers) {
          logger.warn(
            { vehicleId: vehicle.id, maintenanceId: maintenance.id },
            "No active driver assignment found for vehicle, skipping maintenance notification"
          );
          skipped++;
          continue;
        }

        const driver = assignment.rid_drivers;
        const driverEmail = driver.email;

        if (!driverEmail) {
          logger.warn(
            { driverId: driver.id, maintenanceId: maintenance.id },
            "Driver has no email, skipping maintenance notification"
          );
          skipped++;
          continue;
        }

        // Format scheduled date and time
        const scheduledDate = new Date(maintenance.scheduled_date);
        const maintenanceTime = maintenance.actual_start
          ? new Date(maintenance.actual_start).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "09:00"; // Default time if not specified

        // Send notification
        await sendNotification(
          "fleet.vehicle.maintenance_scheduled",
          driverEmail,
          {
            driver_name: driver.first_name || driverEmail.split("@")[0],
            vehicle_make: vehicle.dir_car_makes.name,
            vehicle_model: vehicle.dir_car_models.name,
            vehicle_plate: vehicle.license_plate,
            maintenance_date: scheduledDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            maintenance_time: maintenanceTime,
            maintenance_location: maintenance.provider_name || "Service Center",
            maintenance_type: maintenance.maintenance_type,
            estimated_duration: "2-4 hours", // Default estimate
            maintenance_details_url: `${URLS.app}/driver/maintenance/${maintenance.id}`,
          },
          {
            tenantId: tenant.id,
            idempotencyKey: `maintenance_scheduled_${maintenance.id}`,
          }
        );

        // Mark notification as sent in metadata
        const updatedMetadata = {
          ...(metadata as object),
          notification_sent: true,
          notification_sent_at: new Date().toISOString(),
        };

        await prisma.flt_vehicle_maintenance.update({
          where: { id: maintenance.id },
          data: { metadata: updatedMetadata },
        });

        processed++;
      } catch (error) {
        errors++;
        logger.error(
          {
            maintenanceId: maintenance.id,
            error: error instanceof Error ? error.message : "Unknown",
          },
          "Failed to process maintenance notification"
        );
      }
    }

    const duration = Date.now() - startTime;

    logger.info(
      {
        found: upcomingMaintenance.length,
        processed,
        skipped,
        errors,
        durationMs: duration,
      },
      "Cron: maintenance notifications processed"
    );

    return NextResponse.json(
      {
        success: true,
        found: upcomingMaintenance.length,
        processed,
        skipped,
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
      "Cron: maintenance notifications failed"
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
