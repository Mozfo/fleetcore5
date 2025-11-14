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

interface MemberPasswordResetARProps {
  first_name: string;
  reset_link: string;
  expiry_hours: string;
}

export const MemberPasswordResetAR = ({
  first_name = "محمد",
  reset_link = "https://app.fleetcore.com/reset-password/token123",
  expiry_hours = "24",
}: MemberPasswordResetARProps) => {
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
      <Preview>إعادة تعيين كلمة مرور FleetCore</Preview>
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
              تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في FleetCore.
            </Text>
            <Text style={paragraph}>
              انقر على الزر أدناه لإعادة تعيين كلمة المرور:
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={reset_link}>
                إعادة تعيين كلمة المرور
              </Button>
            </Section>
            <Text style={paragraph}>
              ستنتهي صلاحية هذا الرابط خلال <strong>{expiry_hours} ساعة</strong>
              .
            </Text>
            <Text style={paragraph}>
              إذا لم تطلب إعادة تعيين كلمة المرور هذه، يرجى تجاهل هذا البريد
              الإلكتروني أو الاتصال بالدعم إذا كانت لديك مخاوف.
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

export default MemberPasswordResetAR;

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
