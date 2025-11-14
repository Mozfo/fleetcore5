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

interface MemberPasswordResetFRProps {
  first_name: string;
  reset_link: string;
  expiry_hours: string;
}

export const MemberPasswordResetFR = ({
  first_name = "Jean",
  reset_link = "https://app.fleetcore.com/reset-password/token123",
  expiry_hours = "24",
}: MemberPasswordResetFRProps) => {
  return (
    <Html>
      <Head>
        <style>{`
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content-wrapper { padding: 0 20px !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
      </Head>
      <Preview>Réinitialisez votre mot de passe FleetCore</Preview>
      <Body style={main}>
        <Container style={container} className="container">
          <Section style={box} className="content-wrapper">
            <Link
              href="https://fleetcore.io"
              style={{
                display: "inline-block",
                textDecoration: "none",
              }}
            >
              <Img
                src="https://res.cloudinary.com/dillqmyh7/image/upload/v1763024908/fleetcore-logo_ljrtyn.jpg"
                width="200"
                height="auto"
                alt="FleetCore"
                style={{ display: "block", maxWidth: "100%", height: "auto" }}
              />
            </Link>
            <Hr style={hr} />
            <Text style={paragraph}>Bonjour {first_name},</Text>
            <Text style={paragraph}>
              Nous avons reçu une demande de réinitialisation de mot de passe
              pour votre compte FleetCore.
            </Text>
            <Text style={paragraph}>
              Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de
              passe :
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={reset_link}>
                Réinitialiser le mot de passe
              </Button>
            </Section>
            <Text style={paragraph}>
              Ce lien expirera dans <strong>{expiry_hours} heures</strong>.
            </Text>
            <Text style={paragraph}>
              Si vous n&apos;avez pas demandé cette réinitialisation de mot de
              passe, veuillez ignorer cet email ou contacter le support si vous
              avez des préoccupations.
            </Text>
            <Text style={paragraph}>
              Cordialement,
              <br />
              L&apos;équipe FleetCore
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. Tous droits réservés.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MemberPasswordResetFR;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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
  textAlign: "left" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
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
