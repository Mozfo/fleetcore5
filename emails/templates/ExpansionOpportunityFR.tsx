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

interface ExpansionOpportunityFRProps {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_preposition: string;
  country_name: string;
  phone_row?: string;
  message_row?: string;
}

export const ExpansionOpportunityFR = ({
  first_name,
  company_name,
  fleet_size,
  country_preposition,
  country_name,
  phone_row,
  message_row,
}: ExpansionOpportunityFRProps) => {
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
        Merci pour votre intérêt - Nous vous notifierons lors du lancement
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
            <Text style={paragraph}>Bonjour {first_name},</Text>
            <Text style={paragraph}>
              Merci pour votre intérêt envers FleetCore ! Nous apprécions que
              vous ayez pris le temps de demander une démonstration.
            </Text>
            <Text style={paragraph}>
              FleetCore n&apos;est pas encore disponible {country_preposition}{" "}
              <strong>{country_name}</strong>, mais nous nous développons
              rapidement et votre intérêt est extrêmement précieux pour nous.
              Nous avons enregistré vos coordonnées et vous serez parmi les
              premiers informés lors du lancement dans votre marché.
            </Text>
            <Text style={paragraph}>
              <strong>Détails de votre demande :</strong>
            </Text>
            <Text style={paragraph}>
              • Entreprise : <strong>{company_name}</strong>
              <br />• Taille de flotte : <strong>{fleet_size}</strong>
              <br />• Pays : {country_preposition}{" "}
              <strong>{country_name}</strong>
              <span dangerouslySetInnerHTML={{ __html: phone_row || "" }} />
              <span dangerouslySetInnerHTML={{ __html: message_row || "" }} />
            </Text>
            <Section
              style={{
                textAlign: "center",
                marginTop: "32px",
                marginBottom: "32px",
              }}
            >
              <Button style={button} href="https://fleetcore.io">
                Être notifié lors du lancement
              </Button>
            </Section>
            <Text style={paragraph}>
              En attendant, n&apos;hésitez pas à explorer notre site web pour en
              savoir plus sur la façon dont FleetCore révolutionne la gestion de
              flottes.
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

export default ExpansionOpportunityFR;

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
};
