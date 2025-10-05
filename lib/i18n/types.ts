/**
 * TypeScript types for i18n translations
 */

import type { LucideIcon } from "lucide-react";

export interface FeatureItem {
  name: string;
  desc: string;
  icon?: LucideIcon;
}

export interface ProcessStep {
  title: string;
  desc: string;
  detail: string;
  icon?: LucideIcon;
}

export interface ProofMetric {
  value: string;
  label: string;
  desc: string;
}

export interface HomepageTranslations {
  nav: {
    product: string;
    solutions: string;
    resources: string;
    company: string;
    login: string;
    demo: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    metrics: {
      vehicles: string;
      revenue: string;
      utilization: string;
      bookings: string;
    };
  };
  features: {
    rental: {
      title: string;
      items: FeatureItem[];
    };
    ridehailing: {
      title: string;
      items: FeatureItem[];
    };
  };
  process: {
    title: string;
    subtitle: string;
    steps: ProcessStep[];
  };
  integrations: {
    title: string;
    categoryLabels: {
      platforms: string;
      payments: string;
      accounting: string;
      hardware: string;
    };
    categories: {
      platforms: string[];
      payments: string[];
      accounting: string[];
      hardware: string[];
    };
  };
  proof: {
    title: string;
    metrics: ProofMetric[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
  };
  featuresSection: {
    title: string;
    subtitle: string;
  };
  footer: {
    product: string;
    company: string;
    legal: string;
    copyright: string;
  };
}
