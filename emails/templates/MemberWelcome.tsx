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

interface MemberWelcomeProps {
  first_name: string;
  tenant_name: string;
  email: string;
  role: string;
  dashboard_url: string;
}

export const MemberWelcome = ({
  first_name = "John",
  tenant_name = "Acme Fleet",
  email = "john@example.com",
  role = "Fleet Manager",
  dashboard_url = "https://app.fleetcore.io/dashboard", // ✅ Fixed: fleetcore.io
}: MemberWelcomeProps) => {
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
      <Preview>Welcome to {tenant_name} on FleetCore!</Preview>
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
              Welcome to <strong>{tenant_name}</strong>! Your account has been
              created and you can now access FleetCore.
            </Text>
            <Text style={paragraph}>
              <strong>Your login details:</strong>
            </Text>
            <Text style={paragraph}>
              • Email: <strong>{email}</strong>
              <br />• Role: <strong>{role}</strong>
              <br />• Dashboard: <strong>{dashboard_url}</strong>
            </Text>
            <Text style={paragraph}>
              <strong>Next steps:</strong>
            </Text>
            <Text style={paragraph}>
              1. Complete your profile
              <br />
              2. Set up your preferences
              <br />
              3. Explore the dashboard
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={dashboard_url}>
                Access Dashboard
              </Button>
            </Section>
            <Text style={paragraph}>
              Need help? Contact your administrator or visit our Help Center.
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

export default MemberWelcome;

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
