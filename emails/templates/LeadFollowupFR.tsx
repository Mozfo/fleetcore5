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

interface LeadFollowupFRProps {
  first_name: string;
  company_name: string;
  demo_link: string;
  sales_rep_name: string;
}

export const LeadFollowupFR = ({
  first_name = "Jean",
  company_name = "Paris VTC Services",
  demo_link = "https://app.fleetcore.com/demo/book",
  sales_rep_name = "Sarah Johnson",
}: LeadFollowupFRProps) => {
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
      <Preview>Ne manquez pas votre démonstration FleetCore</Preview>
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
              Nous avons remarqué que vous avez demandé une démonstration de
              FleetCore il y a 2 jours. Nous serions ravis de vous montrer
              comment FleetCore peut optimiser les opérations de votre flotte.
            </Text>
            <Text style={paragraph}>
              <strong>
                Notre plateforme de gestion de flotte aide {company_name} à :
              </strong>
            </Text>
            <Text style={paragraph}>
              • Réduire les coûts de carburant jusqu&apos;à 20%
              <br />
              • Automatiser les paiements et rapports des chauffeurs
              <br />
              • Suivre les véhicules et chauffeurs en temps réel
              <br />• Gérer les opérations multi-plateformes (Uber, Bolt,
              Careem)
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={demo_link}>
                Réserver votre démonstration personnalisée
              </Button>
            </Section>
            <Text style={paragraph}>
              Cordialement,
              <br />
              {sales_rep_name}
              <br />
              Équipe Commerciale FleetCore
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. Tous droits réservés.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LeadFollowupFR;

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
