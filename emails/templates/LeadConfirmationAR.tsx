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
} from "@react-email/components";
import * as React from "react";

interface LeadConfirmationARProps {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_name: string;
}

export const LeadConfirmationAR = ({
  first_name = "محمد",
  company_name = "شركة الاختبار المحدودة",
  fleet_size = "51-100 مركبة",
  country_name = "الإمارات العربية المتحدة",
}: LeadConfirmationARProps) => {
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
      <Preview>سنتواصل معك خلال 24 ساعة</Preview>
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
              شكراً لك على طلب عرض توضيحي من FleetCore! لقد تلقينا طلبك وسنتواصل
              معك خلال 24 ساعة.
            </Text>
            <Text style={paragraph}>
              <strong>تفاصيل طلبك:</strong>
            </Text>
            <Text style={paragraph}>
              • الشركة: <strong>{company_name}</strong>
              <br />• حجم الأسطول: <strong>{fleet_size}</strong>
              <br />• الدولة: <strong>{country_name}</strong>
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

export default LeadConfirmationAR;

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
