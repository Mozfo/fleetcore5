/**
 * BookingConfirmation Email Template
 *
 * V6.5 - Sent after Cal.com BOOKING_CREATED webhook
 *
 * Replaces Cal.com default email with FleetCore branded version.
 * Includes reschedule/cancel links that stay on FleetCore domain.
 *
 * @module emails/templates/BookingConfirmation
 */

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import {
  type EmailLocale,
  getTextDirection,
  getTextAlign,
  isRtlLocale,
  commonTranslations,
  bookingConfirmationTranslations,
} from "@/lib/i18n/email-translations";

// ============================================================================
// TYPES
// ============================================================================

interface BookingConfirmationProps {
  locale?: EmailLocale;
  firstName: string;
  bookingDate: string; // e.g., "Thursday, January 22, 2026"
  bookingTime: string; // e.g., "9:00 AM"
  timezone: string; // e.g., "GMT+4 (Dubai)"
  meetingUrl: string; // Google Meet link
  rescheduleUrl: string; // FleetCore reschedule URL
  cancelUrl: string; // FleetCore cancel URL
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BookingConfirmation = ({
  locale = "en",
  firstName = "Nicolas",
  bookingDate = "Thursday, January 22, 2026",
  bookingTime = "9:00 AM",
  timezone = "GMT+4 (Dubai)",
  meetingUrl = "https://meet.google.com/xxx-xxxx-xxx",
  rescheduleUrl = "https://fleetcore.io/en/r/Xk9mP2",
  cancelUrl = "https://fleetcore.io/en/r/Xk9mP2",
}: BookingConfirmationProps) => {
  const t = bookingConfirmationTranslations[locale];
  const common = commonTranslations[locale];
  const dir = getTextDirection(locale);
  const textAlign = getTextAlign(locale);
  const isRtl = isRtlLocale(locale);

  return (
    <Html dir={dir} lang={locale}>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-wrapper { padding: 0 20px !important; }
            img { max-width: 100% !important; height: auto !important; }
            .info-box { padding: 16px !important; }
            .button-row { display: block !important; }
            .button-col { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
          }
        `}</style>
      </Head>
      <Preview>{t.preview}</Preview>
      <Body style={main(isRtl)}>
        <Container style={container} className="container">
          <Section style={box} className="content-wrapper">
            {/* Logo */}
            <Link
              href="https://fleetcore.io"
              style={{
                display: isRtl ? "block" : "inline-block",
                textAlign: isRtl ? "center" : undefined,
                textDecoration: "none",
              }}
            >
              <Img
                src="https://res.cloudinary.com/dillqmyh7/image/upload/v1763024908/fleetcore-logo_ljrtyn.jpg"
                width="200"
                height="auto"
                alt="FleetCore"
                style={{
                  display: isRtl ? "inline-block" : "block",
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            </Link>
            <Hr style={hr} />

            {/* Success Badge */}
            <Section style={successBadge}>
              <Text style={successText}>✓ {t.confirmed}</Text>
            </Section>

            {/* Greeting */}
            <Text style={paragraph(textAlign)}>
              {common.greeting} {firstName},
            </Text>

            {/* Main message */}
            <Text style={headlineStyle(textAlign)}>{t.headline}</Text>

            <Text style={paragraph(textAlign)}>{t.message}</Text>

            {/* Booking Info Box */}
            <Section style={infoBox} className="info-box">
              <Text style={infoTitle(textAlign)}>{t.bookingDetails}</Text>
              <Row>
                <Column style={infoRow}>
                  <Text style={infoLabel(textAlign)}>📆 {t.date}</Text>
                  <Text style={infoValue(textAlign)}>{bookingDate}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={infoRow}>
                  <Text style={infoLabel(textAlign)}>🕐 {t.time}</Text>
                  <Text style={infoValue(textAlign)}>
                    {bookingTime} ({timezone})
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column style={infoRow}>
                  <Text style={infoLabel(textAlign)}>⏱️ {t.duration}</Text>
                  <Text style={infoValue(textAlign)}>{t.durationValue}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={infoRow}>
                  <Text style={infoLabel(textAlign)}>📍 {t.location}</Text>
                  <Text style={infoValue(textAlign)}>Google Meet</Text>
                </Column>
              </Row>
            </Section>

            {/* Join Meeting Button */}
            <Section style={buttonContainer}>
              <Button style={primaryButton} href={meetingUrl}>
                🎥 {t.joinMeeting}
              </Button>
            </Section>

            {/* What to expect */}
            <Text style={sectionTitle(textAlign)}>{t.whatToExpect}</Text>
            <Section style={expectList}>
              <Text style={expectItem(textAlign)}>✓ {t.expect1}</Text>
              <Text style={expectItem(textAlign)}>✓ {t.expect2}</Text>
              <Text style={expectItem(textAlign)}>✓ {t.expect3}</Text>
            </Section>

            {/* Need to change? */}
            <Text style={smallTitle(textAlign)}>{t.needToChange}</Text>
            <Section style={buttonContainer}>
              <Row className="button-row">
                <Column style={buttonColumn} className="button-col">
                  <Button style={secondaryButton} href={rescheduleUrl}>
                    {t.reschedule}
                  </Button>
                </Column>
                <Column style={buttonColumn} className="button-col">
                  <Button style={cancelButton} href={cancelUrl}>
                    {t.cancel}
                  </Button>
                </Column>
              </Row>
            </Section>

            {/* Signature */}
            <Text style={paragraph(textAlign)}>
              {t.seeYouSoon}
              <br />
              <br />
              {common.regards}
              <br />
              {common.team}
            </Text>

            <Hr style={hr} />
            <Text style={footer(textAlign)}>{common.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingConfirmation;

// ============================================================================
// STYLES
// ============================================================================

const main = (isRtl: boolean) => ({
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  direction: isRtl ? ("rtl" as const) : ("ltr" as const),
});

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "680px",
  width: "100%",
};

const box = {
  padding: "0 40px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const successBadge = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  padding: "12px 20px",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const successText = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "600" as const,
  margin: "0",
};

const paragraph = (textAlign: "left" | "right") => ({
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign,
});

const headlineStyle = (textAlign: "left" | "right") => ({
  color: "#1a1a1a",
  fontSize: "22px",
  fontWeight: "600" as const,
  lineHeight: "28px",
  textAlign,
  margin: "16px 0",
});

const sectionTitle = (textAlign: "left" | "right") => ({
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  textAlign,
  margin: "24px 0 12px",
});

const smallTitle = (textAlign: "left" | "right") => ({
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500" as const,
  textAlign,
  margin: "24px 0 12px",
});

const footer = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign,
});

// Info Box styles
const infoBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  padding: "20px",
  margin: "16px 0",
  border: "1px solid #e2e8f0",
};

const infoTitle = (textAlign: "left" | "right") => ({
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "500" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px",
  textAlign,
});

const infoRow = {
  paddingBottom: "8px",
};

const infoLabel = (textAlign: "left" | "right") => ({
  color: "#64748b",
  fontSize: "14px",
  margin: "0",
  textAlign,
});

const infoValue = (textAlign: "left" | "right") => ({
  color: "#1e293b",
  fontSize: "15px",
  fontWeight: "600" as const,
  margin: "2px 0 0",
  textAlign,
});

// Expect list styles
const expectList = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 16px",
};

const expectItem = (textAlign: "left" | "right") => ({
  color: "#0369a1",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
  textAlign,
});

// Button styles
const buttonContainer = {
  margin: "16px 0",
};

const buttonColumn = {
  width: "48%",
  paddingRight: "8px",
  paddingLeft: "8px",
  verticalAlign: "top" as const,
};

const primaryButton = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
  width: "100%",
};

const secondaryButton = {
  backgroundColor: "#f1f5f9",
  borderRadius: "6px",
  color: "#475569",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 16px",
  width: "100%",
  border: "1px solid #e2e8f0",
};

const cancelButton = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  color: "#dc2626",
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 16px",
  width: "100%",
  border: "1px solid #fecaca",
};
