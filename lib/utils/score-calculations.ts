/**
 * Score Calculations - Frontend display utilities
 *
 * These functions explain how scores are calculated for UI display purposes.
 * Actual scoring is done by the backend service (lead-scoring.service.ts).
 */

import type { Lead } from "@/types/crm";

export interface ScoreFactor {
  key: string; // i18n key
  label: string; // fallback label
  value: number;
  maxValue: number;
  met: boolean;
}

export interface ScoreBreakdown {
  total: number;
  maxTotal: number;
  factors: ScoreFactor[];
}

/**
 * Parse fleet size string to number for comparison
 */
function parseFleetSize(fleetSize: string | null): number {
  if (!fleetSize) return 0;
  // Handle formats like "51-100", "500+", etc.
  const match = fleetSize.match(/(\d+)/);
  if (!match) return 0;
  // For ranges, use the lower bound
  const num = parseInt(match[1], 10);
  // For "500+", treat as 500
  if (fleetSize.includes("+")) return num;
  // For ranges like "51-100", return lower bound
  return num;
}

/**
 * Check if updated_at is within last N days
 */
function isRecentActivity(updatedAt: string | null, days: number = 7): boolean {
  if (!updatedAt) return false;
  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

/**
 * Target countries for B2B fleet management (UAE, FR, SA, QA, etc.)
 */
const TARGET_COUNTRIES = ["AE", "FR", "SA", "QA", "KW", "BH", "OM"];

/**
 * FIT SCORE Breakdown (0-60 points)
 * Measures alignment with Ideal Customer Profile (ICP)
 */
export function calculateFitBreakdown(lead: Lead): ScoreBreakdown {
  const fleetSize = parseFleetSize(lead.fleet_size);

  const factors: ScoreFactor[] = [
    {
      key: "fleet_size_50",
      label: "Fleet size > 50 vehicles",
      value: fleetSize > 50 ? 15 : 0,
      maxValue: 15,
      met: fleetSize > 50,
    },
    {
      key: "fleet_size_100",
      label: "Fleet size > 100 vehicles",
      value: fleetSize > 100 ? 10 : 0,
      maxValue: 10,
      met: fleetSize > 100,
    },
    {
      key: "has_software",
      label: "Uses fleet software",
      value: lead.current_software ? 10 : 0,
      maxValue: 10,
      met: !!lead.current_software,
    },
    {
      key: "target_country",
      label: "Target region (MENA/EU)",
      value: TARGET_COUNTRIES.includes(lead.country_code || "") ? 15 : 5,
      maxValue: 15,
      met: TARGET_COUNTRIES.includes(lead.country_code || ""),
    },
    {
      key: "has_website",
      label: "Company website provided",
      value: lead.website_url ? 5 : 0,
      maxValue: 5,
      met: !!lead.website_url,
    },
    {
      key: "has_linkedin",
      label: "LinkedIn profile provided",
      value: lead.linkedin_url ? 5 : 0,
      maxValue: 5,
      met: !!lead.linkedin_url,
    },
  ];

  return {
    total: factors.reduce((sum, f) => sum + f.value, 0),
    maxTotal: factors.reduce((sum, f) => sum + f.maxValue, 0),
    factors,
  };
}

/**
 * ENGAGEMENT SCORE Breakdown (0-100 points)
 * Measures interaction and interest level
 */
export function calculateEngagementBreakdown(lead: Lead): ScoreBreakdown {
  const messageLength = lead.message?.length || 0;

  const factors: ScoreFactor[] = [
    {
      key: "email_provided",
      label: "Email provided",
      value: lead.email ? 20 : 0,
      maxValue: 20,
      met: !!lead.email,
    },
    {
      key: "phone_provided",
      label: "Phone number provided",
      value: lead.phone ? 20 : 0,
      maxValue: 20,
      met: !!lead.phone,
    },
    {
      key: "message_provided",
      label: "Detailed message",
      value:
        messageLength > 200
          ? 30
          : messageLength > 100
            ? 20
            : messageLength > 20
              ? 10
              : 0,
      maxValue: 30,
      met: messageLength > 20,
    },
    {
      key: "gdpr_consent",
      label: "GDPR consent given",
      value: lead.gdpr_consent ? 15 : 0,
      maxValue: 15,
      met: !!lead.gdpr_consent,
    },
    {
      key: "utm_tracked",
      label: "Campaign attribution",
      value: lead.utm_source ? 10 : 0,
      maxValue: 10,
      met: !!lead.utm_source,
    },
    {
      key: "recent_activity",
      label: "Recent activity (< 7 days)",
      value: isRecentActivity(lead.updated_at) ? 5 : 0,
      maxValue: 5,
      met: isRecentActivity(lead.updated_at),
    },
  ];

  return {
    total: factors.reduce((sum, f) => sum + f.value, 0),
    maxTotal: factors.reduce((sum, f) => sum + f.maxValue, 0),
    factors,
  };
}

/**
 * QUALIFICATION SCORE Breakdown (0-100 points)
 * Composite score: (Fit × 0.4) + (Engagement × 0.6)
 * Normalized to 100 scale
 */
export function calculateQualificationBreakdown(lead: Lead): ScoreBreakdown {
  const fitBreakdown = calculateFitBreakdown(lead);
  const engagementBreakdown = calculateEngagementBreakdown(lead);

  // Normalize fit score to 100 scale (max 60 → 100)
  const fitNormalized = (fitBreakdown.total / fitBreakdown.maxTotal) * 100;
  const fitContribution = Math.round(fitNormalized * 0.4);

  // Engagement is already on 100 scale
  const engagementContribution = Math.round(engagementBreakdown.total * 0.6);

  const factors: ScoreFactor[] = [
    {
      key: "fit_contribution",
      label: `Fit score (40%): ${fitBreakdown.total}/${fitBreakdown.maxTotal}`,
      value: fitContribution,
      maxValue: 40,
      met: fitBreakdown.total > fitBreakdown.maxTotal / 2,
    },
    {
      key: "engagement_contribution",
      label: `Engagement (60%): ${engagementBreakdown.total}/${engagementBreakdown.maxTotal}`,
      value: engagementContribution,
      maxValue: 60,
      met: engagementBreakdown.total > engagementBreakdown.maxTotal / 2,
    },
  ];

  return {
    total: fitContribution + engagementContribution,
    maxTotal: 100,
    factors,
  };
}

/**
 * Get score color class based on value
 */
export function getScoreColor(score: number | null): {
  bg: string;
  text: string;
  gradient: string;
} {
  if (score === null) {
    return {
      bg: "bg-gray-200 dark:bg-gray-700",
      text: "text-gray-500 dark:text-gray-400",
      gradient: "from-gray-300 to-gray-400",
    };
  }
  if (score >= 70) {
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      gradient: "from-emerald-400 to-emerald-600",
    };
  }
  if (score >= 40) {
    return {
      bg: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      gradient: "from-amber-400 to-amber-500",
    };
  }
  return {
    bg: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    gradient: "from-red-400 to-red-500",
  };
}

/**
 * Get score label for display
 */
export function getScoreLabel(
  type: "fit" | "engagement" | "qualification"
): string {
  switch (type) {
    case "fit":
      return "Fit Score";
    case "engagement":
      return "Engagement";
    case "qualification":
      return "Qualification";
  }
}
