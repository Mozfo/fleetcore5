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

interface WebhookTestProps {
  timestamp: string;
  test_id: string;
}

export const WebhookTest = ({
  timestamp = "2025-11-13 10:30:45 UTC",
  test_id = "TEST-123456",
}: WebhookTestProps) => (
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
    <Preview>FleetCore Webhook Test</Preview>
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
          <Text style={paragraph}>
            This is a test notification from FleetCore.
          </Text>
          <Text style={paragraph}>
            • Timestamp: <strong>{timestamp}</strong>
            <br />• Test ID: <strong>{test_id}</strong>
          </Text>
          <Text style={paragraph}>
            If you received this email, webhooks are configured correctly.
          </Text>
          <Text style={paragraph}>FleetCore Engineering Team</Text>
          <Hr style={hr} />
          <Text style={footer}>© 2025 FleetCore. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WebhookTest;

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
