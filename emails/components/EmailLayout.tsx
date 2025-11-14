import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Tailwind,
} from "@react-email/components";
import { EmailHeader } from "./EmailHeader";
import { EmailFooter } from "./EmailFooter";

interface EmailLayoutProps {
  preview: string; // Preview text shown after subject in inbox
  children: React.ReactNode; // Template content
  unsubscribeUrl?: string; // Optional unsubscribe link
}

/**
 * Email Layout Component
 *
 * Provides consistent layout for all FleetCore emails:
 * - Responsive design (max-width 600px)
 * - Tailwind CSS styling
 * - Header with logo
 * - Footer with RGPD links
 *
 * @example
 * ```tsx
 * <EmailLayout preview="Welcome to FleetCore!">
 *   <Heading>Hello {firstName}</Heading>
 *   <Text>Your account is ready.</Text>
 * </EmailLayout>
 * ```
 */
export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: {
                  primary: "#667eea",
                  secondary: "#764ba2",
                },
                priority: {
                  urgent: "#dc2626",
                  high: "#ea580c",
                  medium: "#f59e0b",
                  low: "#22c55e",
                },
              },
            },
          },
        }}
      >
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-[600px] px-4 py-8">
            <EmailHeader />

            {/* Content wrapper - white background with shadow */}
            <Section className="my-4 rounded-lg bg-white p-8 shadow-sm">
              {children}
            </Section>

            <EmailFooter unsubscribeUrl={unsubscribeUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
