/**
 * NurturingRecovery Email Template
 *
 * V6.6 - Recovery email sent T+1h after incomplete wizard
 *
 * Empathetic "technical problem?" tone.
 * Sent when: email_verified=true, wizard_completed=false, created > 1h ago
 *
 * @module emails/templates/NurturingRecovery
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
} from "@react-email/components";
import * as React from "react";
import {
  type EmailLocale,
  getTextDirection,
  getTextAlign,
  isRtlLocale,
  commonTranslations,
  nurturingRecoveryTranslations,
} from "@/lib/i18n/email-translations";

// ============================================================================
// TYPES
// ============================================================================

interface NurturingRecoveryProps {
  locale?: EmailLocale;
  firstName?: string;
  resumeUrl: string;
  unsubscribeUrl: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const NurturingRecovery = ({
  locale = "en",
  firstName,
  resumeUrl = "https://fleetcore.io/api/crm/nurturing/resume?token=xxx",
  unsubscribeUrl = "https://fleetcore.io/unsubscribe?token=xxx",
}: NurturingRecoveryProps) => {
  const t = nurturingRecoveryTranslations[locale];
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

            {/* Greeting */}
            <Text style={paragraph(textAlign)}>
              {common.greeting}
              {firstName ? ` ${firstName}` : ""},
            </Text>

            {/* Headline */}
            <Text style={headlineStyle(textAlign)}>{t.headline}</Text>

            {/* Message */}
            <Text style={paragraph(textAlign)}>{t.message}</Text>

            {/* Tech issue */}
            <Text style={paragraph(textAlign)}>{t.techIssue}</Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={resumeUrl}>
                {t.resumeButton}
              </Button>
            </Section>

            {/* No action needed */}
            <Text style={smallText(textAlign)}>{t.noAction}</Text>

            {/* Signature */}
            <Text style={paragraph(textAlign)}>
              {common.regards}
              <br />
              {common.team}
            </Text>

            <Hr style={hr} />
            <Text style={footer(textAlign)}>{common.footer}</Text>
            <Link href={unsubscribeUrl} style={unsubscribeLink(textAlign)}>
              {t.unsubscribe}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NurturingRecovery;

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
  fontSize: "22px",
  fontWeight: "600" as const,
  lineHeight: "28px",
  textAlign,
  margin: "16px 0",
});

const smallText = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "13px",
  lineHeight: "18px",
  textAlign,
  fontStyle: "italic" as const,
  margin: "8px 0 24px",
});

const footer = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign,
});

const unsubscribeLink = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "11px",
  textDecoration: "underline",
  textAlign,
  display: "block" as const,
  marginTop: "8px",
});

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#656ee8",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
