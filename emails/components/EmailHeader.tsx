import React from "react";
import { Section, Img } from "@react-email/components";

/**
 * Email Header Component
 *
 * Displays FleetCore logo with gradient background.
 * Logo URL is configurable via LOGO_URL environment variable.
 *
 * Logo specs:
 * - Original: 1778x490px (docs/logo/fleetcore-logo.jpg)
 * - Email display: 200px width (auto height)
 * - Background: Brand gradient (blue → purple)
 *
 * @example
 * ```tsx
 * <EmailHeader />
 * ```
 */
export function EmailHeader() {
  // Logo URL from environment variable or default
  const logoUrl =
    process.env.LOGO_URL || "https://cdn.fleetcore.com/logo/fleetcore-logo.jpg";

  return (
    <Section className="from-brand-primary to-brand-secondary rounded-t-lg bg-gradient-to-r p-6 text-center">
      <Img
        src={logoUrl}
        alt="FleetCore"
        width="200"
        height="auto"
        className="mx-auto"
      />
    </Section>
  );
}
