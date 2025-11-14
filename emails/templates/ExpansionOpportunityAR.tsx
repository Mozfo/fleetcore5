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

interface ExpansionOpportunityARProps {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_name: string;
}

export const ExpansionOpportunityAR = ({
  first_name = "محمد",
  company_name = "شركة الاختبار المحدودة",
  fleet_size = "51-100 مركبة",
  country_name = "إسبانيا",
}: ExpansionOpportunityARProps) => {
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
      <Preview>شكراً لاهتمامك - سنخبرك عند الإطلاق</Preview>
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
              شكراً لك على اهتمامك بـ FleetCore! نحن نقدر وقتك في طلب عرض
              توضيحي.
            </Text>
            <Text style={paragraph}>
              FleetCore غير متوفر حالياً في <strong>{country_name}</strong>،
              لكننا نتوسع بسرعة واهتمامك مهم جداً بالنسبة لنا. لقد سجلنا بياناتك
              وستكون من أوائل من يعلم عند إطلاقنا في سوقك.
            </Text>
            <Text style={paragraph}>
              <strong>تفاصيل طلبك:</strong>
            </Text>
            <Text style={paragraph}>
              • الشركة: <strong>{company_name}</strong>
              <br />• حجم الأسطول: <strong>{fleet_size}</strong>
              <br />• الدولة: <strong>{country_name}</strong>
            </Text>
            <Section
              style={{
                textAlign: "center",
                marginTop: "32px",
                marginBottom: "32px",
              }}
            >
              <Button style={button} href="https://fleetcore.io">
                احصل على إشعار عند الإطلاق
              </Button>
            </Section>
            <Text style={paragraph}>
              في غضون ذلك، لا تتردد في استكشاف موقعنا الإلكتروني لمعرفة المزيد
              عن كيفية قيام FleetCore بإحداث ثورة في إدارة الأساطيل.
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

export default ExpansionOpportunityAR;

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

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  width: "auto",
  padding: "12px 32px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "right" as const,
};
