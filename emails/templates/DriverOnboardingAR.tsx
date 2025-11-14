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

interface DriverOnboardingARProps {
  driver_name: string;
  fleet_name: string;
  driver_id: string;
  start_date: string;
  fleet_manager_name: string;
  driver_portal_url: string;
}

export const DriverOnboardingAR = ({
  driver_name = "محمد علي",
  fleet_name = "عمليات أسطول دبي",
  driver_id = "DRV-12345",
  start_date = "2025-12-01",
  fleet_manager_name = "أحمد حسن",
  driver_portal_url = "https://app.fleetcore.com/driver",
}: DriverOnboardingARProps) => {
  return (
    <Html dir="rtl" lang="ar">
      <Head>
        <style>{`
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content-wrapper { padding: 0 20px !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      </Head>
      <Preview>مرحباً بك في {fleet_name} - ابدأ كسائق</Preview>
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
            <Text style={paragraph}>مرحباً {driver_name}،</Text>
            <Text style={paragraph}>
              مرحباً بك في <strong>{fleet_name}</strong>! يسعدنا انضمامك إلى
              فريقنا.
            </Text>
            <Text style={paragraph}>
              <strong>تم إنشاء حساب السائق الخاص بك:</strong>
            </Text>
            <Text style={paragraph}>
              • معرف السائق: <strong>{driver_id}</strong>
              <br />• تاريخ البدء: <strong>{start_date}</strong>
              <br />• مدير الأسطول: <strong>{fleet_manager_name}</strong>
            </Text>
            <Text style={paragraph}>
              <strong>الخطوات التالية:</strong>
            </Text>
            <Text style={paragraph}>
              1. تحميل تطبيق السائق
              <br />
              2. رفع المستندات المطلوبة (الرخصة، التأمين)
              <br />
              3. إكمال التسجيل في المنصات (Uber، Bolt، Careem)
              <br />
              4. مراجعة جدول الدفع والأسعار
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={driver_portal_url}>
                الوصول إلى بوابة السائق
              </Button>
            </Section>
            <Text style={paragraph}>
              هل تحتاج إلى مساعدة؟ اتصل بمدير الأسطول أو الدعم.
            </Text>
            <Text style={paragraph}>
              مع أطيب التحيات،
              <br />
              فريق {fleet_name}
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. جميع الحقوق محفوظة.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DriverOnboardingAR;

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
