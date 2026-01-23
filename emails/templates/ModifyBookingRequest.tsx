/**
 * ModifyBookingRequest Email Template
 *
 * V6.6 - Migrated from inline HTML in send-reschedule-link route
 *
 * This email WORKS ON MOBILE - do not change the button style!
 * Sent when user requests to modify/cancel their booking from step-1.
 *
 * @module emails/templates/ModifyBookingRequest
 */

import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

interface ModifyBookingRequestProps {
  locale?: "en" | "fr";
  firstName?: string;
  rescheduleUrl: string;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
  en: {
    preview: "Modify or Cancel Your FleetCore Demo",
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
    preview: "Modifier ou annuler votre démo FleetCore",
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

// ============================================================================
// COMPONENT
// ============================================================================

export const ModifyBookingRequest = ({
  locale = "en",
  firstName,
  rescheduleUrl = "https://fleetcore.io/en/r/ABC123",
}: ModifyBookingRequestProps) => {
  const t = translations[locale];

  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Link
              href="https://fleetcore.io"
              style={{ textDecoration: "none" }}
            >
              <Img
                src="https://res.cloudinary.com/dillqmyh7/image/upload/v1763024908/fleetcore-logo_ljrtyn.jpg"
                alt="FleetCore"
                width="200"
                height="auto"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Link>
          </Section>

          {/* Greeting */}
          <Text style={heading}>
            {t.greeting}
            {firstName ? ` ${firstName}` : ""},
          </Text>

          {/* Message */}
          <Text style={paragraph}>{t.message}</Text>

          <Text style={paragraph}>{t.clickBelow}</Text>

          {/* CTA Button - THIS STYLE WORKS ON MOBILE */}
          <Section style={buttonContainer}>
            <Link href={rescheduleUrl} style={button}>
              {t.buttonText}
            </Link>
          </Section>

          {/* Disclaimer */}
          <Text style={disclaimer}>{t.notYou}</Text>

          {/* Signature */}
          <Text style={signature}>
            {t.regards}
            <br />
            <strong>{t.team}</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ModifyBookingRequest;

// ============================================================================
// STYLES - EXACT MATCH OF WORKING EMAIL
// ============================================================================

const main = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: "1.6",
  color: "#333",
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const heading = {
  color: "#1e3a5f",
  fontSize: "24px",
  fontWeight: "bold" as const,
  marginBottom: "20px",
};

const paragraph = {
  marginBottom: "20px",
  fontSize: "16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  display: "inline-block",
  backgroundColor: "#2563eb",
  color: "white",
  padding: "14px 32px",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: "600" as const,
  fontSize: "16px",
};

const disclaimer = {
  color: "#666",
  fontSize: "14px",
  marginTop: "30px",
  paddingTop: "20px",
  borderTop: "1px solid #eee",
};

const signature = {
  marginTop: "30px",
  fontSize: "16px",
};
