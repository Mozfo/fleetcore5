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

interface InsuranceExpiryAlertARProps {
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

export const InsuranceExpiryAlertAR = ({
  fleet_manager_name = "محمد أحمد",
  vehicle_make = "تويوتا",
  vehicle_model = "كامري",
  vehicle_plate = "ABC-123",
  expiry_date = "2025-12-31",
  days_remaining = "3",
  insurance_provider = "شركة التأمين AXA",
  policy_number = "POL-123456",
  insurance_details_url = "https://app.fleetcore.com/insurance/details",
}: InsuranceExpiryAlertARProps) => {
  return (
    <Html dir="rtl" lang="ar">
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
      <Preview>⚠️ انتهاء التأمين قريباً: {vehicle_plate}</Preview>
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
            <div style={alertBadge}>⚠️ عاجل</div>
            <Text style={paragraph}>مرحباً {fleet_manager_name}،</Text>
            <Text style={paragraph}>
              <strong>تأمين المركبة على وشك الانتهاء!</strong>
            </Text>
            <div style={alertCard} className="alert-card">
              <Text style={cardTitle}>
                {vehicle_make} {vehicle_model}
              </Text>
              <Text style={cardSubtitle}>اللوحة: {vehicle_plate}</Text>
              <Text style={paragraph}>
                • تاريخ الانتهاء: <strong>{expiry_date}</strong>
                <br />• الأيام المتبقية: <strong>{days_remaining}</strong>
                <br />• مزود التأمين: <strong>{insurance_provider}</strong>
                <br />• رقم البوليصة: <strong>{policy_number}</strong>
              </Text>
            </div>
            <Text style={paragraph}>
              <strong>إجراء مطلوب:</strong> قم بتجديد التأمين فوراً للحفاظ على
              الامتثال وتجنب انقطاع الخدمة.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={insurance_details_url}>
                عرض التفاصيل
              </Button>
            </Section>
            <Text style={paragraph}>
              مع أطيب التحيات،
              <br />
              فريق الامتثال FleetCore
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. جميع الحقوق محفوظة.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InsuranceExpiryAlertAR;

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
  textAlign: "right" as const,
};

const cardSubtitle = {
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
