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

interface SalesRepAssignmentARProps {
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

export const SalesRepAssignmentAR = ({
  employee_name = "مندوب المبيعات",
  lead_name = "عميل محتمل تجريبي",
  company_name = "شركة تجريبية",
  priority = "high",
  fit_score = 50,
  qualification_score = 72,
  lead_stage = "مؤهل للمبيعات",
  fleet_size = "101-200 مركبة",
  country_code = "AE",
  lead_detail_url = "https://app.fleetcore.com/crm/leads/123",
}: SalesRepAssignmentARProps) => {
  const priorityColors = {
    urgent: "#dc2626",
    high: "#ea580c",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  const priorityLabels = {
    urgent: "عاجل",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
  };

  return (
    <Html dir="rtl" lang="ar">
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
      <Preview>عميل محتمل جديد بأولوية {priorityLabels[priority]}</Preview>
      <Body style={main}>
        <Container style={container} className="container">
          <Section style={box} className="content-wrapper">
            <Link
              href="https://fleetcore.io"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              <Img
                src="https://res.cloudinary.com/dillqmyh7/image/upload/v1763024908/fleetcore-logo_ljrtyn.jpg"
                width="200"
                height="auto"
                alt="FleetCore"
                style={{
                  display: "inline-block",
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            </Link>
            <Hr style={hr} />
            <div style={priorityBadge(priorityColors[priority])}>
              {priorityLabels[priority].toUpperCase()}
            </div>
            <Text style={paragraph}>مرحباً {employee_name}،</Text>
            <Text style={paragraph}>
              تم تعيين عميل محتمل جديد بأولوية{" "}
              <strong>{priorityLabels[priority]}</strong> لك:
            </Text>
            <div style={leadCard} className="lead-card">
              <Text style={leadName}>{lead_name}</Text>
              <Text style={companyName}>{company_name}</Text>
              <Text style={paragraph}>
                • حجم الأسطول: <strong>{fleet_size}</strong>
                <br />• الدولة: <strong>{country_code}</strong>
                <br />• درجة التأهيل: <strong>{qualification_score}/100</strong>
                <br />• درجة الملاءمة: <strong>{fit_score}/60</strong>
                <br />• المرحلة: <strong>{lead_stage}</strong>
              </Text>
            </div>
            <Section style={buttonContainer}>
              <Button style={button} href={lead_detail_url}>
                عرض تفاصيل العميل المحتمل
              </Button>
            </Section>
            <Text style={paragraph}>
              مع أطيب التحيات،
              <br />
              فريق FleetCore
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. جميع الحقوق محفوظة.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SalesRepAssignmentAR;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  direction: "rtl" as const,
};

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

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "right" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "right" as const,
};

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
  textAlign: "right" as const,
};

const companyName = {
  fontSize: "14px",
  color: "#525f7f",
  margin: "0 0 16px 0",
  textAlign: "right" as const,
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
