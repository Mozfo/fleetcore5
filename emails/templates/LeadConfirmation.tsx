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

interface LeadConfirmationProps {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_preposition: string;
  country_name: string;
  phone_row?: string;
  message_row?: string;
}

export const LeadConfirmation = ({
  first_name,
  company_name,
  fleet_size,
  country_preposition: _country_preposition,
  country_name,
  phone_row,
  message_row,
}: LeadConfirmationProps) => {
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
      <Preview>We will contact you within 24 hours</Preview>
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
            <Text style={paragraph}>Hello {first_name},</Text>
            <Text style={paragraph}>
              Thank you for requesting a demo of FleetCore! We have received
              your request and will contact you within 24 hours.
            </Text>
            <Text style={paragraph}>
              <strong>Your request details:</strong>
            </Text>
            <Text style={paragraph}>
              • Company: <strong>{company_name}</strong>
              <br />• Fleet size: <strong>{fleet_size}</strong>
              <br />• Country: <strong>{country_name}</strong>
              <span dangerouslySetInnerHTML={{ __html: phone_row || "" }} />
              <span dangerouslySetInnerHTML={{ __html: message_row || "" }} />
            </Text>
            <Text style={paragraph}>
              Best regards,
              <br />
              The FleetCore Team
            </Text>
            <Hr style={hr} />
            <Text style={footer}>© 2025 FleetCore. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LeadConfirmation;

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
