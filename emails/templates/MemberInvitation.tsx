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
  memberInvitationTranslations,
} from "@/lib/i18n/email-translations";

interface MemberInvitationProps {
  locale?: EmailLocale;
  inviter_name: string;
  tenant_name: string;
  invite_url: string;
  expiry_days: string;
}

export const MemberInvitation = ({
  locale = "en",
  inviter_name = "Admin",
  tenant_name = "Acme Fleet",
  invite_url = "https://app.fleetcore.io/en/accept-invitation?id=abc",
  expiry_days = "7",
}: MemberInvitationProps) => {
  const t = memberInvitationTranslations[locale];
  const common = commonTranslations[locale];
  const dir = getTextDirection(locale);
  const textAlign = getTextAlign(locale);
  const isRtl = isRtlLocale(locale);

  const inviterLine = inviter_name
    ? `${inviter_name} ${t.invitedTo} ${tenant_name} ${t.onFleetCore}`
    : t.invitedToFleetCore;

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
            <Text style={heading(textAlign)}>{t.preview}</Text>
            <Text style={paragraph(textAlign)}>{inviterLine}</Text>
            <Text style={paragraph(textAlign)}>{t.clickButton}</Text>
            <Section style={buttonContainer}>
              <Button style={button} href={invite_url}>
                {t.acceptButton}
              </Button>
            </Section>
            <Text style={paragraph(textAlign)}>
              {t.linkExpiry}{" "}
              <strong>
                {expiry_days} {t.days}
              </strong>
              .
            </Text>
            <Text style={paragraph(textAlign)}>{t.didntExpect}</Text>
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

export default MemberInvitation;

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
  fontSize: "20px",
  fontWeight: "600" as const,
  lineHeight: "28px",
  textAlign,
  margin: "0 0 16px",
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
