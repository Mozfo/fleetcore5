/**
 * Email Verification Code Template - V6.2.2
 * Book Demo Wizard - 6-digit verification code email
 *
 * @module emails/templates/EmailVerificationCode
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
} from "@react-email/components";
import * as React from "react";
import {
  type EmailLocale,
  getTextDirection,
  getTextAlign,
  isRtlLocale,
  commonTranslations,
  emailVerificationCodeTranslations,
} from "@/lib/i18n/email-translations";

interface EmailVerificationCodeProps {
  locale?: EmailLocale;
  code: string;
  expiresInMinutes?: number;
}

export const EmailVerificationCode = ({
  locale = "en",
  code = "123456",
  expiresInMinutes = 15,
}: EmailVerificationCodeProps) => {
  const t = emailVerificationCodeTranslations[locale];
  const common = commonTranslations[locale];
  const dir = getTextDirection(locale);
  const textAlign = getTextAlign(locale);
  const isRtl = isRtlLocale(locale);

  // Format code with spaces for readability: "123 456"
  const formattedCode =
    code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  return (
    <Html dir={dir} lang={locale}>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-wrapper { padding: 0 20px !important; }
            img { max-width: 100% !important; height: auto !important; }
            .code-box { font-size: 28px !important; padding: 16px 24px !important; }
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

            {/* Title */}
            <Text style={title(textAlign)}>{t.title}</Text>

            {/* Code Label */}
            <Text style={paragraph(textAlign)}>{t.codeLabel}</Text>

            {/* Verification Code Box */}
            <Section style={codeContainer}>
              <Text style={codeBox} className="code-box">
                {formattedCode}
              </Text>
            </Section>

            {/* Expiry Warning */}
            <Text style={expiryText(textAlign)}>
              ⏱️ {t.expires.replace("{{minutes}}", String(expiresInMinutes))}
            </Text>

            {/* Ignore Message */}
            <Text style={ignoreText(textAlign)}>{t.ignore}</Text>

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

export default EmailVerificationCode;

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

const title = (textAlign: "left" | "right") => ({
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600" as const,
  lineHeight: "32px",
  textAlign,
  margin: "0 0 16px 0",
});

const paragraph = (textAlign: "left" | "right") => ({
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign,
});

const codeContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const codeBox = {
  backgroundColor: "#f4f6f8",
  borderRadius: "8px",
  color: "#1a1a1a",
  display: "inline-block",
  fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
  fontSize: "36px",
  fontWeight: "700" as const,
  letterSpacing: "8px",
  padding: "20px 32px",
  margin: "0 auto",
};

const expiryText = (textAlign: "left" | "right") => ({
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign,
  margin: "16px 0",
});

const ignoreText = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "13px",
  lineHeight: "20px",
  textAlign,
  fontStyle: "italic" as const,
  margin: "24px 0 0 0",
});

const footer = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign,
});
