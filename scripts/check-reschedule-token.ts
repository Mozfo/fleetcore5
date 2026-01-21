/**
 * Check if reschedule_token exists for recent bookings
 *
 * Usage: pnpm tsx scripts/check-reschedule-token.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function checkTokens(): Promise<void> {
  // Find leads with booking_calcom_uid (they have bookings)
  const leadsWithBookings = await prisma.crm_leads.findMany({
    where: {
      booking_calcom_uid: { not: null },
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      booking_calcom_uid: true,
      reschedule_token: true,
      booking_slot_at: true,
      updated_at: true,
    },
    orderBy: { updated_at: "desc" },
    take: 5,
  });

  logger.info("─".repeat(60));
  logger.info("LEADS WITH BOOKINGS (most recent 5)");
  logger.info("─".repeat(60));

  for (const lead of leadsWithBookings) {
    const hasToken = !!lead.reschedule_token;
    const status = hasToken ? "✅" : "❌";

    logger.info({
      status,
      email: lead.email,
      booking_uid: lead.booking_calcom_uid?.slice(0, 8) + "...",
      reschedule_token: lead.reschedule_token || "MISSING",
      booking_date: lead.booking_slot_at?.toISOString(),
    });
  }

  // Check for leads WITHOUT token but WITH booking
  const leadsWithoutToken = leadsWithBookings.filter(
    (l) => !l.reschedule_token
  );

  logger.info("─".repeat(60));
  if (leadsWithoutToken.length > 0) {
    logger.error(
      `PROBLEM: ${leadsWithoutToken.length} leads have bookings but NO reschedule_token!`
    );
    process.exit(1);
  } else {
    logger.info("✅ All leads with bookings have reschedule_token");
    process.exit(0);
  }
}

checkTokens()
  .catch((err) => {
    logger.error({ err }, "Error checking tokens");
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
