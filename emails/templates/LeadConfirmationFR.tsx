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

interface LeadConfirmationFRProps {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_name: string;
}

export const LeadConfirmationFR = ({
  first_name = "Jean",
  company_name = "Paris VTC Services",
  fleet_size = "51-100 véhicules",
  country_name = "France",
}: LeadConfirmationFRProps) => {
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
      <Preview>Nous vous contacterons dans les 24 heures</Preview>
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
              Merci d&apos;avoir demandé une démonstration de FleetCore ! Nous
              avons bien reçu votre demande et vous contacterons dans les 24
              heures.
            </Text>
            <Text style={paragraph}>
              <strong>Détails de votre demande :</strong>
            </Text>
            <Text style={paragraph}>
              • Entreprise : <strong>{company_name}</strong>
              <br />• Taille de flotte : <strong>{fleet_size}</strong>
              <br />• Pays : <strong>{country_name}</strong>
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

export default LeadConfirmationFR;

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
