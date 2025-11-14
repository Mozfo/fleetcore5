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

interface MemberWelcomeFRProps {
  first_name: string;
  tenant_name: string;
  email: string;
  role: string;
  dashboard_url: string;
}

export const MemberWelcomeFR = ({
  first_name = "Jean",
  tenant_name = "Acme Fleet",
  email = "jean@example.com",
  role = "Gestionnaire de flotte",
  dashboard_url = "https://app.fleetcore.io/dashboard",
}: MemberWelcomeFRProps) => {
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
      <Preview>Bienvenue chez {tenant_name} sur FleetCore !</Preview>
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
              Bienvenue chez <strong>{tenant_name}</strong> ! Votre compte a été
              créé et vous pouvez maintenant accéder à FleetCore.
            </Text>
            <Text style={paragraph}>
              <strong>Vos identifiants de connexion :</strong>
            </Text>
            <Text style={paragraph}>
              • Email : <strong>{email}</strong>
              <br />• Rôle : <strong>{role}</strong>
              <br />• Tableau de bord : <strong>{dashboard_url}</strong>
            </Text>
            <Text style={paragraph}>
              <strong>Prochaines étapes :</strong>
            </Text>
            <Text style={paragraph}>
              1. Complétez votre profil
              <br />
              2. Configurez vos préférences
              <br />
              3. Explorez le tableau de bord
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={dashboard_url}>
                Accéder au tableau de bord
              </Button>
            </Section>
            <Text style={paragraph}>
              Besoin d&apos;aide ? Contactez votre administrateur ou consultez
              notre Centre d&apos;aide.
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

export default MemberWelcomeFR;

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
