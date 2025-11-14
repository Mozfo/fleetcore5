import React from "react";
import { Section, Text, Link, Hr } from "@react-email/components";

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

/**
 * Email Footer Component
 *
 * Displays RGPD-compliant footer with:
 * - Privacy Policy link
 * - Terms of Service link
 * - Unsubscribe link (optional)
 * - Copyright notice
 *
 * @example
 * ```tsx
 * <EmailFooter unsubscribeUrl="https://app.fleetcore.com/unsubscribe/abc123" />
 * ```
 */
export function EmailFooter({ unsubscribeUrl }: EmailFooterProps) {
  const currentYear = new Date().getFullYear();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.com";

  return (
    <Section className="mt-8 text-center text-xs text-gray-500">
      <Hr className="my-4 border-gray-300" />

      <Text className="mb-2">
        © {currentYear} FleetCore. All rights reserved.
      </Text>

      <Text className="mb-2">
        <Link
          href={`${baseUrl}/privacy`}
          className="text-brand-primary underline"
        >
          Privacy Policy
        </Link>
        {" · "}
        <Link
          href={`${baseUrl}/terms`}
          className="text-brand-primary underline"
        >
          Terms of Service
        </Link>
        {unsubscribeUrl && (
          <>
            {" · "}
            <Link href={unsubscribeUrl} className="text-gray-500 underline">
              Unsubscribe
            </Link>
          </>
        )}
      </Text>

      <Text className="mt-4 text-gray-400">
        FleetCore - Professional Fleet Management Solution
      </Text>
    </Section>
  );
}
