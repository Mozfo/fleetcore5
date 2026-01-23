/**
 * Expansion Opportunity Email Template
 *
 * V6.3 - Marketing-focused email for non-operational countries
 *
 * Structure:
 * 1. Section 1: Why FleetCore (marketing pitch with benefits)
 * 2. Section 2: Stay informed (single CTA to survey page)
 *    - Survey page collects: fleet size + GDPR consent
 *
 * @module emails/templates/ExpansionOpportunity
 */

import {
  Body,
  Button,
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
  expansionOpportunityTranslations,
} from "@/lib/i18n/email-translations";

interface ExpansionOpportunityProps {
  locale?: EmailLocale;
  country_preposition: string;
  country_name: string;
  survey_url?: string; // URL to collect fleet details + opt-in
}

export const ExpansionOpportunity = ({
  locale = "en",
  country_preposition: _country_preposition,
  country_name: _country_name,
  survey_url,
}: ExpansionOpportunityProps) => {
  const t = expansionOpportunityTranslations[locale];
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
          .benefit-icon { font-size: 24px !important; }
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

            {/* ========================================== */}
            {/* SECTION 1: Why FleetCore (Marketing Pitch) */}
            {/* ========================================== */}
            <Section style={sectionBox}>
              <Text style={sectionTitle(textAlign)}>{t.whyFleetcoreTitle}</Text>
              <Text style={paragraph(textAlign)}>{t.whyFleetcoreIntro}</Text>

              {/* Benefits list - using simple structure for email compatibility */}
              <Section style={benefitsContainer}>
                {/* Benefit 1: Save time */}
                <Text style={benefitItem(textAlign)}>
                  <span style={benefitEmoji}>⏱️</span>{" "}
                  <strong>{t.benefit1Title}</strong>
                  <br />
                  <span style={benefitDescription}>{t.benefit1Text}</span>
                </Text>

                {/* Benefit 2: Increase profitability */}
                <Text style={benefitItem(textAlign)}>
                  <span style={benefitEmoji}>📈</span>{" "}
                  <strong>{t.benefit2Title}</strong>
                  <br />
                  <span style={benefitDescription}>{t.benefit2Text}</span>
                </Text>

                {/* Benefit 3: One platform */}
                <Text style={benefitItem(textAlign)}>
                  <span style={benefitEmoji}>🎯</span>{" "}
                  <strong>{t.benefit3Title}</strong>
                  <br />
                  <span style={benefitDescription}>{t.benefit3Text}</span>
                </Text>

                {/* Benefit 4: Grow with confidence */}
                <Text style={benefitItem(textAlign)}>
                  <span style={benefitEmoji}>🚀</span>{" "}
                  <strong>{t.benefit4Title}</strong>
                  <br />
                  <span style={benefitDescription}>{t.benefit4Text}</span>
                </Text>
              </Section>
            </Section>

            <Hr style={hr} />

            {/* ========================================== */}
            {/* SECTION 2: Stay informed (Single CTA) */}
            {/* ========================================== */}
            <Section style={sectionBox}>
              <Text style={sectionTitle(textAlign)}>{t.stayInformedTitle}</Text>
              <Text style={paragraph(textAlign)}>{t.stayInformedMessage}</Text>

              {survey_url && (
                <Section
                  style={{
                    textAlign: "center",
                    margin: "30px 0",
                  }}
                >
                  <Button style={buttonPrimary} href={survey_url}>
                    {t.optInButton}
                  </Button>
                </Section>
              )}
            </Section>

            <Hr style={hr} />

            {/* ========================================== */}
            {/* FOOTER */}
            {/* ========================================== */}
            <Section
              style={{
                textAlign: "center",
                margin: "30px 0",
              }}
            >
              <Button style={buttonTertiary} href="https://fleetcore.io">
                {t.visitWebsite}
              </Button>
            </Section>

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

export default ExpansionOpportunity;

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

const sectionBox = {
  marginBottom: "8px",
};

const sectionTitle = (textAlign: "left" | "right") => ({
  color: "#2563eb",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "28px",
  textAlign,
  marginBottom: "12px",
});

const paragraph = (textAlign: "left" | "right") => ({
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign,
  margin: "0 0 12px 0",
});

const benefitsContainer = {
  marginTop: "20px",
};

const benefitItem = (textAlign: "left" | "right") => ({
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign,
  marginBottom: "16px",
  padding: "12px 16px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  borderLeft: "4px solid #2563eb",
});

const benefitEmoji = {
  fontSize: "20px",
};

const benefitDescription = {
  color: "#6b7280",
  fontSize: "14px",
};

const buttonPrimary = {
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

const buttonTertiary = {
  backgroundColor: "#f3f4f6",
  borderRadius: "4px",
  color: "#374151",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign,
});
