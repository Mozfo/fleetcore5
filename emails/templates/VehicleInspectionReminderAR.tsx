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

interface VehicleInspectionReminderARProps {
  fleet_manager_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  due_date: string;
  days_remaining: string;
  booking_link: string;
}

export const VehicleInspectionReminderAR = ({
  fleet_manager_name = "محمد أحمد",
  vehicle_make = "تويوتا",
  vehicle_model = "كامري",
  vehicle_plate = "ABC-123",
  due_date = "2025-12-31",
  days_remaining = "7",
  booking_link = "https://app.fleetcore.com/inspections/book",
}: VehicleInspectionReminderARProps) => {
  return (
    <Html dir="rtl" lang="ar">
      <Head>
        <style>{`
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content-wrapper { padding: 0 20px !important; }
          .info-card { padding: 12px !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      </Head>
      <Preview>موعد فحص المركبة قريباً: {vehicle_plate}</Preview>
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
            <Text style={paragraph}>مرحباً {fleet_manager_name}،</Text>
            <Text style={paragraph}>
              هذا تذكير بأن موعد فحص المركبة قريب لـ:
            </Text>
            <div style={infoCard} className="info-card">
              <Text style={cardTitle}>
                {vehicle_make} {vehicle_model}
              </Text>
              <Text style={cardSubtitle}>اللوحة: {vehicle_plate}</Text>
              <Text style={paragraph}>
                • تاريخ الاستحقاق: <strong>{due_date}</strong>
                <br />• الأيام المتبقية: <strong>{days_remaining}</strong>
              </Text>
            </div>
            <Text style={paragraph}>يرجى جدولة الفحص لتجنب انقطاع الخدمة.</Text>
            <Section style={buttonContainer}>
              <Button style={button} href={booking_link}>
                حجز الفحص
              </Button>
            </Section>
            <Text style={paragraph}>
              مع أطيب التحيات،
              <br />
              عمليات FleetCore
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. جميع الحقوق محفوظة.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VehicleInspectionReminderAR;

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

const infoCard = {
  backgroundColor: "#f6f9fc",
  padding: "20px",
  borderRadius: "4px",
  margin: "20px 0",
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
