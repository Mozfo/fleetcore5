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
  insuranceExpiryAlertTranslations,
} from "@/lib/i18n/email-translations";

interface InsuranceExpiryAlertProps {
  locale?: EmailLocale;
  fleet_manager_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  expiry_date: string;
  days_remaining: string;
  insurance_provider: string;
  policy_number: string;
  insurance_details_url: string;
}

export const InsuranceExpiryAlert = ({
  locale = "en",
  fleet_manager_name = "John Smith",
  vehicle_make = "Toyota",
  vehicle_model = "Camry",
  vehicle_plate = "ABC-123",
  expiry_date = "2025-12-31",
  days_remaining = "3",
  insurance_provider = "AXA Insurance",
  policy_number = "POL-123456",
  insurance_details_url = "https://app.fleetcore.com/insurance/details",
}: InsuranceExpiryAlertProps) => {
  const t = insuranceExpiryAlertTranslations[locale];
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
      <Preview>{t.preview.replace("{vehicle_plate}", vehicle_plate)}</Preview>
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
            <div style={alertBadge}>{t.urgent}</div>
            <Text style={paragraph(textAlign)}>
              {common.greeting} {fleet_manager_name},
            </Text>
            <Text style={paragraph(textAlign)}>
              <strong>{t.expiringTitle}</strong>
            </Text>
            <div style={alertCard} className="alert-card">
              <Text style={cardTitle}>
                {vehicle_make} {vehicle_model}
              </Text>
              <Text style={cardSubtitle}>
                {t.plate}: {vehicle_plate}
              </Text>
              <Text style={paragraph(textAlign)}>
                • {t.expiryDate}: <strong>{expiry_date}</strong>
                <br />• {t.daysRemaining}: <strong>{days_remaining}</strong>
                <br />• {t.provider}: <strong>{insurance_provider}</strong>
                <br />• {t.policyNumber}: <strong>{policy_number}</strong>
              </Text>
            </div>
            <Text style={paragraph(textAlign)}>
              <strong>{t.actionRequired}</strong> {t.renewMessage}
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={insurance_details_url}>
                {common.viewDetails}
              </Button>
            </Section>
            <Text style={paragraph(textAlign)}>
              {common.regards}
              <br />
              {t.compliance}
            </Text>
            <Hr style={hr} />
            <Text style={footer(textAlign)}>{common.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InsuranceExpiryAlert;

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

const alertBadge = {
  display: "inline-block",
  backgroundColor: "#ea580c",
  color: "#ffffff",
  padding: "6px 12px",
  borderRadius: "4px",
  fontWeight: "600" as const,
  fontSize: "12px",
  letterSpacing: "0.5px",
  marginBottom: "20px",
};

const alertCard = {
  backgroundColor: "#fef2f2",
  padding: "20px",
  borderRadius: "4px",
  margin: "20px 0",
  border: "2px solid #fca5a5",
  boxSizing: "border-box" as const,
  width: "100%",
};

const cardTitle = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#32325d",
  margin: "0 0 4px 0",
};

const cardSubtitle = {
  fontSize: "14px",
  color: "#525f7f",
  margin: "0 0 16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#ea580c",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
