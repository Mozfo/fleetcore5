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
  salesRepAssignmentTranslations,
} from "@/lib/i18n/email-translations";

interface SalesRepAssignmentProps {
  locale?: EmailLocale;
  employee_name: string;
  lead_name: string;
  company_name: string;
  priority: "urgent" | "high" | "medium" | "low";
  fit_score: number;
  qualification_score: number;
  lead_stage: string;
  fleet_size: string;
  country_code: string;
  lead_detail_url: string;
}

export const SalesRepAssignment = ({
  locale = "en",
  employee_name = "Sales Rep",
  lead_name = "Test Lead",
  company_name = "Test Company",
  priority = "high",
  fit_score = 50,
  qualification_score = 72,
  lead_stage = "Sales Qualified",
  fleet_size = "101-200 vehicles",
  country_code = "US",
  lead_detail_url = "https://app.fleetcore.com/crm/leads/123",
}: SalesRepAssignmentProps) => {
  const t = salesRepAssignmentTranslations[locale];
  const common = commonTranslations[locale];
  const dir = getTextDirection(locale);
  const textAlign = getTextAlign(locale);
  const isRtl = isRtlLocale(locale);

  const priorityColors = {
    urgent: "#dc2626",
    high: "#ea580c",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  return (
    <Html dir={dir} lang={locale}>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-wrapper { padding: 0 20px !important; }
            .lead-card { padding: 12px !important; }
            img { max-width: 100% !important; height: auto !important; }
          }
        `}</style>
      </Head>
      <Preview>{t.preview.replace("{priority}", priority)}</Preview>
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
            <div style={priorityBadge(priorityColors[priority])}>
              {priority.toUpperCase()}
            </div>
            <Text style={paragraph(textAlign)}>
              {common.greeting} {employee_name},
            </Text>
            <Text style={paragraph(textAlign)}>
              {t.newLead} <strong>{priority}</strong> {t.priorityLead}
            </Text>
            <div style={leadCard} className="lead-card">
              <Text style={leadName}>{lead_name}</Text>
              <Text style={companyNameStyle}>{company_name}</Text>
              <Text style={paragraph(textAlign)}>
                • {t.fleetSize}: <strong>{fleet_size}</strong>
                <br />• {t.country}: <strong>{country_code}</strong>
                <br />• {t.qualificationScore}:{" "}
                <strong>{qualification_score}/100</strong>
                <br />• {t.fitScore}: <strong>{fit_score}/60</strong>
                <br />• {t.stage}: <strong>{lead_stage}</strong>
              </Text>
            </div>
            <Section style={buttonContainer}>
              <Button style={button} href={lead_detail_url}>
                {t.viewButton}
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

export default SalesRepAssignment;

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

const priorityBadge = (bgColor: string) => ({
  display: "inline-block",
  backgroundColor: bgColor,
  color: "#ffffff",
  padding: "6px 12px",
  borderRadius: "4px",
  fontWeight: "600" as const,
  fontSize: "12px",
  letterSpacing: "0.5px",
  marginBottom: "20px",
});

const leadCard = {
  backgroundColor: "#f6f9fc",
  padding: "20px",
  borderRadius: "4px",
  margin: "20px 0",
  boxSizing: "border-box" as const,
  width: "100%",
};

const leadName = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#32325d",
  margin: "0 0 4px 0",
};

const companyNameStyle = {
  fontSize: "14px",
  color: "#525f7f",
  margin: "0 0 16px 0",
};

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
