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

interface DriverOnboardingFRProps {
  driver_name: string;
  fleet_name: string;
  driver_id: string;
  start_date: string;
  fleet_manager_name: string;
  driver_portal_url: string;
}

export const DriverOnboardingFR = ({
  driver_name = "Mohammed Ali",
  fleet_name = "Paris VTC Services",
  driver_id = "DRV-12345",
  start_date = "2025-12-01",
  fleet_manager_name = "Ahmed Hassan",
  driver_portal_url = "https://app.fleetcore.com/driver",
}: DriverOnboardingFRProps) => {
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
      <Preview>
        Bienvenue chez {fleet_name} - Commencez en tant que chauffeur
      </Preview>
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
            <Text style={paragraph}>Bonjour {driver_name},</Text>
            <Text style={paragraph}>
              Bienvenue chez <strong>{fleet_name}</strong> ! Nous sommes ravis
              de vous accueillir dans notre équipe.
            </Text>
            <Text style={paragraph}>
              <strong>Votre compte chauffeur a été créé :</strong>
            </Text>
            <Text style={paragraph}>
              • ID chauffeur : <strong>{driver_id}</strong>
              <br />• Date de début : <strong>{start_date}</strong>
              <br />• Gestionnaire de flotte :{" "}
              <strong>{fleet_manager_name}</strong>
            </Text>
            <Text style={paragraph}>
              <strong>Prochaines étapes :</strong>
            </Text>
            <Text style={paragraph}>
              1. Téléchargez l&apos;application chauffeur
              <br />
              2. Téléversez les documents requis (permis, assurance)
              <br />
              3. Complétez l&apos;intégration des plateformes (Uber, Bolt,
              Careem)
              <br />
              4. Consultez le calendrier de paiement et les tarifs
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={driver_portal_url}>
                Accéder au portail chauffeur
              </Button>
            </Section>
            <Text style={paragraph}>
              Besoin d&apos;aide ? Contactez votre gestionnaire de flotte ou le
              support.
            </Text>
            <Text style={paragraph}>
              Cordialement,
              <br />
              L&apos;équipe {fleet_name}
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. Tous droits réservés.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DriverOnboardingFR;

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
