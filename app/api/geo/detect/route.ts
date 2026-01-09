/**
 * GeoIP Detection API
 *
 * V6.2.3 - Endpoint pour détecter le pays de l'utilisateur via son IP
 *
 * GET /api/geo/detect
 *
 * Response:
 * {
 *   "success": true,
 *   "countryCode": "AE" | null,
 *   "detected": true | false
 * }
 *
 * @module app/api/geo/detect/route
 */

import { NextRequest, NextResponse } from "next/server";
import { geoIPService } from "@/lib/services/geo/geoip.service";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const result = await geoIPService.detectCountry(request);

    logger.info(
      { ip: result.ip, countryCode: result.countryCode },
      "[GeoIP] Country detection"
    );

    return NextResponse.json({
      success: true,
      countryCode: result.countryCode,
      detected: result.detected,
    });
  } catch (error) {
    logger.error({ error }, "[GeoIP] Detection failed");

    return NextResponse.json({
      success: true,
      countryCode: null,
      detected: false,
    });
  }
}
