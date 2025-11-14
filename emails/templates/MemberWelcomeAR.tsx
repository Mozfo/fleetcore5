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

interface MemberWelcomeARProps {
  first_name: string;
  tenant_name: string;
  email: string;
  role: string;
  dashboard_url: string;
}

export const MemberWelcomeAR = ({
  first_name = "محمد",
  tenant_name = "أسطول دبي",
  email = "mohamed@example.com",
  role = "مدير الأسطول",
  dashboard_url = "https://app.fleetcore.io/dashboard",
}: MemberWelcomeARProps) => {
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
      <Preview>مرحباً بك في {tenant_name} على FleetCore!</Preview>
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
            <Text style={paragraph}>مرحباً {first_name}،</Text>
            <Text style={paragraph}>
              مرحباً بك في <strong>{tenant_name}</strong>! تم إنشاء حسابك ويمكنك
              الآن الوصول إلى FleetCore.
            </Text>
            <Text style={paragraph}>
              <strong>بيانات تسجيل الدخول الخاصة بك:</strong>
            </Text>
            <Text style={paragraph}>
              • البريد الإلكتروني: <strong>{email}</strong>
              <br />• الدور: <strong>{role}</strong>
              <br />• لوحة التحكم: <strong>{dashboard_url}</strong>
            </Text>
            <Text style={paragraph}>
              <strong>الخطوات التالية:</strong>
            </Text>
            <Text style={paragraph}>
              1. أكمل ملفك الشخصي
              <br />
              2. قم بتكوين تفضيلاتك
              <br />
              3. استكشف لوحة التحكم
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={dashboard_url}>
                الوصول إلى لوحة التحكم
              </Button>
            </Section>
            <Text style={paragraph}>
              هل تحتاج إلى مساعدة؟ اتصل بالمسؤول أو استشر مركز المساعدة الخاص
              بنا.
            </Text>
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

export default MemberWelcomeAR;

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
