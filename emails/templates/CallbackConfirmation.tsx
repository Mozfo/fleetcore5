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
import {
  type EmailLocale,
  getTextDirection,
  getTextAlign,
  isRtlLocale,
  commonTranslations,
  callbackConfirmationTranslations,
} from "@/lib/i18n/email-translations";

interface CallbackConfirmationProps {
  locale?: EmailLocale;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  fleet_size: string;
}

export const CallbackConfirmation = ({
  locale = "en",
  first_name,
  company_name,
  phone,
  fleet_size,
}: CallbackConfirmationProps) => {
  const t = callbackConfirmationTranslations[locale];
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
      <Preview>{t.preview}</Preview>
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
            <Text style={heading(textAlign)}>{t.title}</Text>
            <Text style={paragraph(textAlign)}>
              {common.greeting} {first_name},
            </Text>
            <Text style={paragraph(textAlign)}>{t.thankYou}</Text>
            <Text style={paragraph(textAlign)}>
              <strong>{t.requestDetails}</strong>
            </Text>
            <Text style={paragraph(textAlign)}>
              • {t.company}: <strong>{company_name}</strong>
              <br />• {t.fleetSize}: <strong>{fleet_size}</strong>
              {phone && (
                <>
                  <br />• {t.phone}: <strong>{phone}</strong>
                </>
              )}
            </Text>
            <Text style={paragraph(textAlign)}>
              <strong>{t.whatNext}</strong>
            </Text>
            <Text style={paragraph(textAlign)}>
              1. {t.step1}
              <br />
              2. {t.step2}
              <br />
              3. {t.step3}
            </Text>
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

export default CallbackConfirmation;

// Dynamic styles based on RTL
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

const heading = (textAlign: "left" | "right") => ({
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold" as const,
  lineHeight: "32px",
  textAlign,
});

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
