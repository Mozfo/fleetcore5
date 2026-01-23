/**
 * Customer Verification Email Template - V6.2-8.5
 *
 * Sent after successful Stripe checkout to new customers.
 * Contains verification link (24h expiry) to complete account setup.
 *
 * @module emails/templates/CustomerVerification
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
  customerVerificationTranslations,
} from "@/lib/i18n/email-translations";

interface CustomerVerificationProps {
  locale?: EmailLocale;
  company_name: string;
  tenant_code: string;
  verification_url: string;
  expires_in_hours?: number;
}

export const CustomerVerification = ({
  locale = "en",
  company_name = "Acme Fleet SAS",
  tenant_code = "C-ABC123",
  verification_url = "https://app.fleetcore.io/en/verify?token=test123",
  expires_in_hours = 24,
}: CustomerVerificationProps) => {
  const t = customerVerificationTranslations[locale];
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
          .tenant-code { font-size: 24px !important; }
        }
      `}</style>
      </Head>
      <Preview>{t.preview}</Preview>
      <Body style={main(isRtl)}>
        <Container style={container} className="container">
          <Section style={box} className="content-wrapper">
            {/* Logo cliquable */}
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

            {/* Success Message */}
            <Text style={successBadge(textAlign)}>{t.paymentSuccess}</Text>
            <Text style={paragraph(textAlign)}>{t.thankYou}</Text>

            {/* Tenant Code Display */}
            <Section style={codeContainer}>
              <Text style={codeLabel(textAlign)}>{t.yourAccountCode}</Text>
              <Text style={tenantCodeStyle} className="tenant-code">
                {tenant_code}
              </Text>
              <Text style={companyNameStyle}>{company_name}</Text>
            </Section>

            {/* Next Steps */}
            <Text style={paragraph(textAlign)}>{t.nextStep}</Text>
            <Text style={instructionsStyle(textAlign)}>{t.instructions}</Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={verification_url}>
                {t.completeButton}
              </Button>
            </Section>

            {/* Expiry Warning */}
            <Section style={warningContainer}>
              <Text style={warningText(textAlign)}>
                {t.expiresIn}{" "}
                <strong>
                  {expires_in_hours} {t.hours}
                </strong>
              </Text>
              <Text style={warningImportant(textAlign)}>{t.warning}</Text>
            </Section>

            {/* Help */}
            <Text style={helpText(textAlign)}>
              {t.needHelp}{" "}
              <Link href="mailto:support@fleetcore.io" style={linkStyle}>
                support@fleetcore.io
              </Link>
            </Text>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={paragraph(textAlign)}>
              {common.regards}
              <br />
              {common.team}
            </Text>
            <Text style={footer(textAlign)}>{common.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomerVerification;

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

const successBadge = (textAlign: "left" | "right") => ({
  color: "#22c55e",
  fontSize: "20px",
  fontWeight: "700" as const,
  lineHeight: "28px",
  textAlign,
  marginBottom: "8px",
});

const codeContainer = {
  backgroundColor: "#f0f9ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeLabel = (_textAlign: "left" | "right") => ({
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign: "center" as const,
  margin: "0 0 8px 0",
});

const tenantCodeStyle = {
  color: "#1e40af",
  fontSize: "32px",
  fontWeight: "700" as const,
  fontFamily: "monospace",
  letterSpacing: "2px",
  textAlign: "center" as const,
  margin: "8px 0",
};

const companyNameStyle = {
  color: "#334155",
  fontSize: "16px",
  fontWeight: "500" as const,
  textAlign: "center" as const,
  margin: "8px 0 0 0",
};

const instructionsStyle = (textAlign: "left" | "right") => ({
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign,
  marginBottom: "24px",
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

const warningContainer = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  borderLeft: "4px solid #f59e0b",
};

const warningText = (textAlign: "left" | "right") => ({
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign,
  margin: "0 0 8px 0",
});

const warningImportant = (textAlign: "left" | "right") => ({
  color: "#92400e",
  fontSize: "13px",
  fontWeight: "600" as const,
  lineHeight: "18px",
  textAlign,
  margin: "0",
});

const helpText = (textAlign: "left" | "right") => ({
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign,
});

const linkStyle = {
  color: "#2563eb",
  textDecoration: "underline",
};

const footer = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign,
});
