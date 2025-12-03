/**
 * Cron Worker: Process Notification Queue
 *
 * Endpoint: GET /api/cron/notifications/process
 * Schedule: Every 1 minute (configure in vercel.json)
 * Security: Protected by CRON_SECRET header
 *
 * Created: Session #29 (2025-11-28)
 * Purpose: Process adm_notification_queue entries
 *
 * Vercel cron config (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/notifications/process",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextResponse } from "next/server";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { logger } from "@/lib/logger";

// Vercel cron jobs call GET
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max for cron

/**
 * GET /api/cron/notifications/process
 *
 * Called by Vercel cron every minute to process pending notifications.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // SECURITY: Validate cron secret (Vercel sets Authorization header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error({}, "CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    // Vercel sends: Authorization: Bearer <CRON_SECRET>
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn(
        { authHeader: authHeader ? "present but invalid" : "missing" },
        "Unauthorized cron request"
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process queue
    const queueService = new NotificationQueueService();
    const result = await queueService.processQueue(10); // Process up to 10 notifications

    const duration = Date.now() - startTime;

    logger.info(
      {
        ...result,
        durationMs: duration,
      },
      "Cron: notification queue processed"
    );

    return NextResponse.json(
      {
        success: true,
        ...result,
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
      "Cron: notification queue processing failed"
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
