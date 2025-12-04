/**
 * Cron Worker: Insurance Expiry Alerts
 *
 * Endpoint: GET /api/cron/fleet/insurance
 * Schedule: Daily at 8:00 AM (0 8 * * *)
 * Security: Protected by CRON_SECRET header
 *
 * Purpose: Send alert emails for vehicle insurances expiring within 30 days
 * Updates: Sets renewal_notice_sent = true after notification is queued
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/fleet/insurance
 *
 * Finds vehicle insurances expiring within the next 30 days where renewal_notice_sent = false,
 * sends notification to fleet manager, and marks renewal_notice_sent = true.
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

    // Calculate date range: today to 30 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find insurances expiring within 30 days where notice not sent
    const expiringInsurances = await prisma.flt_vehicle_insurances.findMany({
      where: {
        end_date: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        renewal_notice_sent: false,
        is_active: true,
        deleted_at: null,
      },
      include: {
        flt_vehicles: {
          include: {
            dir_car_makes: true,
            dir_car_models: true,
            adm_tenants: {
              include: {
                adm_members: {
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

    for (const insurance of expiringInsurances) {
      try {
        const vehicle = insurance.flt_vehicles;
        const tenant = vehicle.adm_tenants;
        const fleetManager = tenant.adm_members[0];

        if (!fleetManager) {
          logger.warn(
            { tenantId: tenant.id, insuranceId: insurance.id },
            "No fleet manager found for tenant, skipping insurance expiry alert"
          );
          continue;
        }

        // Calculate days remaining
        const expiryDate = new Date(insurance.end_date);
        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send notification
        await sendNotification(
          "fleet.vehicle.insurance_expiry",
          fleetManager.email,
          {
            fleet_manager_name: fleetManager.email.split("@")[0],
            vehicle_make: vehicle.dir_car_makes.name,
            vehicle_model: vehicle.dir_car_models.name,
            vehicle_plate: vehicle.license_plate,
            expiry_date: expiryDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            days_remaining: daysRemaining.toString(),
            insurance_provider: insurance.provider_name,
            policy_number: insurance.policy_number,
            insurance_details_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io"}/fleet/insurance/${insurance.id}`,
          },
          {
            tenantId: tenant.id,
            idempotencyKey: `insurance_expiry_${insurance.id}`,
          }
        );

        // Mark notice as sent
        await prisma.flt_vehicle_insurances.update({
          where: { id: insurance.id },
          data: { renewal_notice_sent: true },
        });

        processed++;
      } catch (error) {
        errors++;
        logger.error(
          {
            insuranceId: insurance.id,
            error: error instanceof Error ? error.message : "Unknown",
          },
          "Failed to process insurance expiry alert"
        );
      }
    }

    const duration = Date.now() - startTime;

    logger.info(
      {
        found: expiringInsurances.length,
        processed,
        errors,
        durationMs: duration,
      },
      "Cron: insurance expiry alerts processed"
    );

    return NextResponse.json(
      {
        success: true,
        found: expiringInsurances.length,
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
      "Cron: insurance expiry alerts failed"
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
