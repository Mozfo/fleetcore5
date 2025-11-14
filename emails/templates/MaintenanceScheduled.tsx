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

interface MaintenanceScheduledProps {
  driver_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  maintenance_date: string;
  maintenance_time: string;
  maintenance_location: string;
  maintenance_type: string;
  estimated_duration: string;
  maintenance_details_url: string;
}

export const MaintenanceScheduled = ({
  driver_name = "Mohammed Ali",
  vehicle_make = "Toyota",
  vehicle_model = "Camry",
  vehicle_plate = "ABC-123",
  maintenance_date = "2025-12-15",
  maintenance_time = "10:00 AM",
  maintenance_location = "Dubai Service Center",
  maintenance_type = "Regular Service",
  estimated_duration = "2 hours",
  maintenance_details_url = "https://app.fleetcore.com/maintenance/details",
}: MaintenanceScheduledProps) => (
  <Html>
    <Head>
      <style>{`
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content-wrapper { padding: 0 20px !important; }
          .info-card { padding: 12px !important; }
          img { max-width: 100% !important; height: auto !important; }
        }
      `}</style>
    </Head>
    <Preview>
      Maintenance scheduled: {vehicle_plate} on {maintenance_date}
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
          <Text style={paragraph}>Hello {driver_name},</Text>
          <Text style={paragraph}>
            Maintenance has been scheduled for your vehicle.
          </Text>
          <div style={infoCard} className="info-card">
            <Text style={cardTitle}>
              {vehicle_make} {vehicle_model}
            </Text>
            <Text style={cardSubtitle}>Plate: {vehicle_plate}</Text>
            <Text style={paragraph}>
              • Date: <strong>{maintenance_date}</strong>
              <br />• Time: <strong>{maintenance_time}</strong>
              <br />• Location: <strong>{maintenance_location}</strong>
              <br />• Type: <strong>{maintenance_type}</strong>
              <br />• Estimated duration: <strong>{estimated_duration}</strong>
            </Text>
          </div>
          <Text style={paragraph}>
            Please plan accordingly and ensure the vehicle is available.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={maintenance_details_url}>
              View Details
            </Button>
          </Section>
          <Text style={paragraph}>
            Best regards,
            <br />
            FleetCore Maintenance Team
          </Text>
          <Hr style={hr} />
          <Text style={footer}>© 2025 FleetCore. All rights reserved.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default MaintenanceScheduled;

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

const infoCard = {
  backgroundColor: "#f6f9fc",
  padding: "20px",
  borderRadius: "4px",
  margin: "20px 0",
  boxSizing: "border-box" as const,
  width: "100%",
};

const cardTitle = {
  fontSize: "18px",
  fontWeight: "600" as const,
  color: "#32325d",
  margin: "0 0 4px 0",
};

const cardSubtitle = {
  fontSize: "14px",
  color: "#525f7f",
  margin: "0 0 16px 0",
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
