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
import {
  type EmailLocale,
  getTextDirection,
  getTextAlign,
  isRtlLocale,
  commonTranslations,
  memberWelcomeTranslations,
} from "@/lib/i18n/email-translations";

interface MemberWelcomeProps {
  locale?: EmailLocale;
  first_name: string;
  tenant_name: string;
  email: string;
  role: string;
  dashboard_url: string;
}

export const MemberWelcome = ({
  locale = "en",
  first_name = "John",
  tenant_name = "Acme Fleet",
  email = "john@example.com",
  role = "Fleet Manager",
  dashboard_url = "https://app.fleetcore.io/dashboard",
}: MemberWelcomeProps) => {
  const t = memberWelcomeTranslations[locale];
  const common = commonTranslations[locale];
  const dir = getTextDirection(locale);
  const textAlign = getTextAlign(locale);
  const isRtl = isRtlLocale(locale);

  return (
    <Html dir={dir} lang={locale}>
      <Head>
        <style>{`
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content-wrapper { padding: 0 20px !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      </Head>
      <Preview>{t.preview.replace("{tenant_name}", tenant_name)}</Preview>
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
            <Text style={paragraph(textAlign)}>
              {common.greeting} {first_name},
            </Text>
            <Text style={paragraph(textAlign)}>
              {t.welcomeTo} <strong>{tenant_name}</strong>
              {t.accountCreated}
            </Text>
            <Text style={paragraph(textAlign)}>
              <strong>{t.loginDetails}</strong>
            </Text>
            <Text style={paragraph(textAlign)}>
              • {t.email}: <strong>{email}</strong>
              <br />• {t.role}: <strong>{role}</strong>
              <br />• {t.dashboard}: <strong>{dashboard_url}</strong>
            </Text>
            <Text style={paragraph(textAlign)}>
              <strong>{t.nextSteps}</strong>
            </Text>
            <Text style={paragraph(textAlign)}>
              1. {t.step1}
              <br />
              2. {t.step2}
              <br />
              3. {t.step3}
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={dashboard_url}>
                {common.accessDashboard}
              </Button>
            </Section>
            <Text style={paragraph(textAlign)}>{t.needHelp}</Text>
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

export default MemberWelcome;

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
