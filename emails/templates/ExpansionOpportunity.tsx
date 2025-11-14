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

interface ExpansionOpportunityProps {
  first_name: string;
  company_name: string;
  fleet_size: string;
  country_name: string;
}

export const ExpansionOpportunity = ({
  first_name = "John",
  company_name = "Test Company Ltd",
  fleet_size = "51-100 vehicles",
  country_name = "Spain",
}: ExpansionOpportunityProps) => {
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
        Thank you for your interest - We&apos;ll notify you when we launch
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
            <Text style={paragraph}>Hello {first_name},</Text>
            <Text style={paragraph}>
              Thank you for your interest in FleetCore! We appreciate you taking
              the time to request a demo.
            </Text>
            <Text style={paragraph}>
              FleetCore is not yet available in <strong>{country_name}</strong>,
              but we&apos;re expanding rapidly and your interest is extremely
              valuable to us. We&apos;ve recorded your details and you&apos;ll
              be among the first to know when we launch in your market.
            </Text>
            <Text style={paragraph}>
              <strong>Your request details:</strong>
            </Text>
            <Text style={paragraph}>
              • Company: <strong>{company_name}</strong>
              <br />• Fleet size: <strong>{fleet_size}</strong>
              <br />• Country: <strong>{country_name}</strong>
            </Text>
            <Section
              style={{
                textAlign: "center",
                marginTop: "32px",
                marginBottom: "32px",
              }}
            >
              <Button style={button} href="https://fleetcore.io">
                Get Notified When We Launch
              </Button>
            </Section>
            <Text style={paragraph}>
              In the meantime, feel free to explore our website to learn more
              about how FleetCore is revolutionizing fleet management.
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

export default ExpansionOpportunity;

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
