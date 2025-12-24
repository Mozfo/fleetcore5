/**
 * Stripe Webhook Endpoint
 *
 * POST /api/webhooks/stripe
 *
 * Cet endpoint reçoit les webhooks de Stripe et les dispatch
 * vers le WebhookHandlerService.
 *
 * IMPORTANT:
 * - La signature doit être vérifiée AVANT tout traitement
 * - Retourner 200 rapidement (Stripe timeout = 20s)
 * - Le traitement lourd se fait de manière asynchrone
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  webhookHandlerService,
  stripeClientService,
  isStripeConfigured,
} from "@/lib/services/stripe";
import { logger } from "@/lib/logger";

// Désactiver le body parser de Next.js pour les webhooks
// Stripe nécessite le raw body pour vérifier la signature
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 *
 * Reçoit et traite les webhooks Stripe
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Vérifier que Stripe est configuré
    if (!isStripeConfigured()) {
      logger.warn("[StripeWebhook] Received but Stripe is not configured");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    // Récupérer le raw body (nécessaire pour vérifier la signature)
    const body = await request.text();

    // Récupérer la signature Stripe depuis les headers
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      logger.warn("[StripeWebhook] Received without signature");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Vérifier la signature et construire l'événement
    let event;
    try {
      event = stripeClientService.constructWebhookEvent(body, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error(
        { error: message },
        "[StripeWebhook] Signature verification failed"
      );
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    // Log l'événement reçu
    logger.info(
      { eventId: event.id, eventType: event.type },
      "[StripeWebhook] Event received"
    );

    // Traiter l'événement
    // Note: On utilise un fire-and-forget pattern pour les événements longs
    // afin de répondre rapidement à Stripe (timeout = 20s)
    const result = await webhookHandlerService.handleWebhookEvent(event);

    const processingTime = Date.now() - startTime;

    // Log le résultat
    if (result.success) {
      logger.info(
        {
          eventId: event.id,
          eventType: event.type,
          action: result.action,
          processingTimeMs: processingTime,
        },
        "[StripeWebhook] Processed successfully"
      );
    } else {
      logger.error(
        {
          eventId: event.id,
          eventType: event.type,
          error: result.error,
          processingTimeMs: processingTime,
        },
        "[StripeWebhook] Processing failed"
      );
    }

    // Toujours retourner 200 pour éviter les retries de Stripe
    // Les erreurs sont loggées et peuvent être traitées manuellement
    return NextResponse.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      success: result.success,
      action: result.action,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "[StripeWebhook] Endpoint error");

    // Retourner 500 uniquement pour les erreurs système graves
    // (pas pour les erreurs de traitement métier)
    return NextResponse.json(
      { error: "Internal server error", message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/stripe
 *
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/stripe",
    stripeConfigured: isStripeConfigured(),
    supportedEvents: webhookHandlerService.getSupportedEventTypes(),
  });
}
