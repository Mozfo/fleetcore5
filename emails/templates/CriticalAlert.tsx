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
  criticalAlertTranslations,
} from "@/lib/i18n/email-translations";

interface CriticalAlertProps {
  locale?: EmailLocale;
  alert_title: string;
  alert_time: string;
  severity: string;
  affected_items: string;
  alert_description: string;
  recommended_action: string;
  alert_url: string;
}

export const CriticalAlert = ({
  locale = "en",
  alert_title = "Database Connection Failure",
  alert_time = "2025-11-13 10:30 AM",
  severity = "CRITICAL",
  affected_items = "3 tenants, 15 users",
  alert_description = "The primary database connection has been lost. Services are operating in degraded mode.",
  recommended_action = "Check database server status and network connectivity immediately.",
  alert_url = "https://app.fleetcore.com/alerts/123",
}: CriticalAlertProps) => {
  const t = criticalAlertTranslations[locale];
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
          .alert-card { padding: 12px !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      </Head>
      <Preview>{t.preview.replace("{alert_title}", alert_title)}</Preview>
      <Body style={main(isRtl)}>
        <Container style={container} className="container">
          <Section style={box} className="content-wrapper">
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
            <div style={criticalBadge}>{t.badge}</div>
            <Text style={alertTitle(textAlign)}>{alert_title}</Text>
            <div style={alertCard} className="alert-card">
              <Text style={paragraph(textAlign)}>
                • {t.time}: <strong>{alert_time}</strong>
                <br />• {t.severity}: <strong>{severity}</strong>
                <br />• {t.affected}: <strong>{affected_items}</strong>
              </Text>
              <Hr style={hr} />
              <Text style={paragraph(textAlign)}>
                <strong>{t.description}</strong>
                <br />
                {alert_description}
              </Text>
              <Hr style={hr} />
              <Text style={paragraph(textAlign)}>
                <strong>{t.recommendedAction}</strong>
                <br />
                {recommended_action}
              </Text>
            </div>
            <Section style={buttonContainer}>
              <Button style={button} href={alert_url}>
                {t.viewButton}
              </Button>
            </Section>
            <Text style={paragraph(textAlign)}>{t.automated}</Text>
            <Text style={paragraph(textAlign)}>{t.monitoring}</Text>
            <Hr style={hr} />
            <Text style={footer(textAlign)}>{common.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CriticalAlert;

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

const footer = (textAlign: "left" | "right") => ({
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign,
});

const criticalBadge = {
  display: "inline-block",
  backgroundColor: "#dc2626",
  color: "#ffffff",
  padding: "8px 16px",
  borderRadius: "4px",
  fontWeight: "700" as const,
  fontSize: "14px",
  letterSpacing: "0.5px",
  marginBottom: "20px",
};

const alertTitle = (textAlign: "left" | "right") => ({
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#dc2626",
  margin: "0 0 20px 0",
  lineHeight: "32px",
  textAlign,
});

const alertCard = {
  backgroundColor: "#fef2f2",
  padding: "20px",
  borderRadius: "4px",
  margin: "20px 0",
  border: "2px solid #dc2626",
  boxSizing: "border-box" as const,
  width: "100%",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#dc2626",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
