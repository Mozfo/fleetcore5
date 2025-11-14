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

interface LeadFollowupARProps {
  first_name: string;
  company_name: string;
  demo_link: string;
  sales_rep_name: string;
}

export const LeadFollowupAR = ({
  first_name = "محمد",
  company_name = "شركة الاختبار المحدودة",
  demo_link = "https://app.fleetcore.com/demo/book",
  sales_rep_name = "سارة أحمد",
}: LeadFollowupARProps) => {
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
      <Preview>لا تفوت عرض FleetCore التوضيحي</Preview>
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
              لاحظنا أنك طلبت عرضاً توضيحياً لـ FleetCore منذ يومين. يسعدنا أن
              نوضح لك كيف يمكن لـ FleetCore تحسين عمليات أسطولك.
            </Text>
            <Text style={paragraph}>
              <strong>
                منصة إدارة الأسطول لدينا تساعد {company_name} على:
              </strong>
            </Text>
            <Text style={paragraph}>
              • تقليل تكاليف الوقود بنسبة تصل إلى 20%
              <br />
              • أتمتة دفعات السائقين والتقارير
              <br />
              • تتبع المركبات والسائقين في الوقت الفعلي
              <br />• إدارة عمليات متعددة المنصات (Uber، Bolt، Careem)
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={demo_link}>
                احجز عرضك التوضيحي المخصص
              </Button>
            </Section>
            <Text style={paragraph}>
              مع أطيب التحيات،
              <br />
              {sales_rep_name}
              <br />
              فريق مبيعات FleetCore
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. جميع الحقوق محفوظة.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LeadFollowupAR;

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
