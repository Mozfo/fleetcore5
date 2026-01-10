/**
 * DemoReminderJ1 Email Template
 *
 * V6.2.9 - J-1 Demo Reminder Anti-No-Show
 *
 * Sent 1 day before scheduled demo to:
 * 1. Remind lead about the upcoming demo
 * 2. Get confirmation ("I'll be there")
 * 3. Offer reschedule option (internal FleetCore link)
 *
 * @module emails/templates/DemoReminderJ1
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
  demoReminderJ1Translations,
} from "@/lib/i18n/email-translations";

// ============================================================================
// TYPES
// ============================================================================

interface DemoReminderJ1Props {
  locale?: EmailLocale;
  firstName: string;
  companyName: string;
  bookingDate: string; // e.g., "Monday, January 13, 2026"
  bookingTime: string; // e.g., "2:30 PM"
  timezone: string; // e.g., "GMT+4"
  phone: string; // e.g., "+971 50 123 4567"
  fleetSize: string; // e.g., "6-10 vehicles"
  confirmUrl: string; // /api/crm/leads/confirm-attendance?token={token}
  rescheduleUrl: string; // /book-demo/reschedule?uid={booking_calcom_uid}
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DemoReminderJ1 = ({
  locale = "en",
  firstName = "John",
  companyName: _companyName = "Acme Corp",
  bookingDate = "Monday, January 13, 2026",
  bookingTime = "2:30 PM",
  timezone = "GMT+4",
  phone = "+971 50 123 4567",
  fleetSize = "6-10 vehicles",
  confirmUrl = "https://fleetcore.io/api/crm/leads/confirm-attendance?token=xxx",
  rescheduleUrl = "https://fleetcore.io/book-demo/reschedule?uid=xxx",
}: DemoReminderJ1Props) => {
  const t = demoReminderJ1Translations[locale];
  const common = commonTranslations[locale];
  const dir = getTextDirection(locale);
  const textAlign = getTextAlign(locale);
  const isRtl = isRtlLocale(locale);

  // Replace {{fleetSize}} in preparing text
  const preparingText = t.preparing.replace("{{fleetSize}}", fleetSize);

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
      <Preview>{t.preview.replace("{{time}}", bookingTime)}</Preview>
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

            {/* Greeting */}
            <Text style={paragraph(textAlign)}>
              {common.greeting} {firstName},
            </Text>

            {/* Reminder headline */}
            <Text style={headlineStyle(textAlign)}>{t.reminder}</Text>

            {/* Info Box */}
            <Section style={infoBox} className="info-box">
              <Text style={infoTitle(textAlign)}>{t.scheduledFor}</Text>
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
                  <Text style={infoLabel(textAlign)}>📞 {t.phone}</Text>
                  <Text style={infoValue(textAlign)}>{phone}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={infoRow}>
                  <Text style={infoLabel(textAlign)}>⏱️ {t.duration}</Text>
                  <Text style={infoValue(textAlign)}>{t.durationValue}</Text>
                </Column>
              </Row>
            </Section>

            {/* Preparing message */}
            <Text style={paragraph(textAlign)}>{preparingText}</Text>

            {/* Confirm question */}
            <Text style={questionStyle(textAlign)}>{t.confirmQuestion}</Text>

            {/* Two CTA Buttons */}
            <Section style={buttonContainer}>
              <Row className="button-row">
                <Column style={buttonColumn} className="button-col">
                  <Button style={primaryButton} href={confirmUrl}>
                    {t.confirmButton}
                  </Button>
                </Column>
                <Column style={buttonColumn} className="button-col">
                  <Button style={secondaryButton} href={rescheduleUrl}>
                    {t.rescheduleButton}
                  </Button>
                </Column>
              </Row>
            </Section>

            {/* Commitment message */}
            <Text style={commitmentStyle(textAlign)}>{t.commitment}</Text>

            {/* Can't make it */}
            <Text style={smallText(textAlign)}>{t.cantMakeIt}</Text>

            {/* Signature */}
            <Text style={paragraph(textAlign)}>
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

export default DemoReminderJ1;

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

const paragraph = (textAlign: "left" | "right") => ({
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign,
});

const headlineStyle = (textAlign: "left" | "right") => ({
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600" as const,
  lineHeight: "28px",
  textAlign,
  margin: "16px 0",
});

const questionStyle = (textAlign: "left" | "right") => ({
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600" as const,
  lineHeight: "26px",
  textAlign,
  margin: "24px 0 16px",
});

const commitmentStyle = (textAlign: "left" | "right") => ({
  color: "#22c55e",
  fontSize: "14px",
  fontWeight: "500" as const,
  lineHeight: "20px",
  textAlign,
  margin: "16px 0",
  padding: "12px",
  backgroundColor: "#f0fdf4",
  borderRadius: "6px",
});

const smallText = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "13px",
  lineHeight: "18px",
  textAlign,
  margin: "8px 0 24px",
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

// Button styles
const buttonContainer = {
  margin: "24px 0",
};

const buttonColumn = {
  width: "48%",
  paddingRight: "8px",
  paddingLeft: "8px",
  verticalAlign: "top" as const,
};

const primaryButton = {
  backgroundColor: "#22c55e",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 20px",
  width: "100%",
};

const secondaryButton = {
  backgroundColor: "#f1f5f9",
  borderRadius: "6px",
  color: "#475569",
  fontSize: "15px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 20px",
  width: "100%",
  border: "1px solid #e2e8f0",
};
