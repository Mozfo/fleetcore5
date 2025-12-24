/**
 * Lead 360 Types - Single Source of Truth
 *
 * Lead = Golden Record for all prospect data
 * Opportunities and Quotes REFERENCE Lead via FK (no data duplication)
 *
 * @module lib/types/crm/lead.types
 */

import type {
  crm_leads,
  crm_opportunities,
  crm_quotes,
  crm_lead_activities,
  crm_countries,
  dir_country_locales,
  adm_provider_employees,
  crm_lead_sources,
} from "@prisma/client";

// ============================================
// BASE TYPES (from Prisma)
// ============================================

export type Lead = crm_leads;
export type Opportunity = crm_opportunities;
export type Quote = crm_quotes;
export type Activity = crm_lead_activities;

// ============================================
// COUNTRY & LOCALE
// ============================================

/**
 * Country data from crm_countries
 * Used for GDPR checks and operational status
 */
export interface CountryData {
  country_code: string;
  country_name_en: string;
  country_name_fr: string | null;
  country_gdpr: boolean;
  is_operational: boolean;
}

/**
 * Locale data from dir_country_locales
 * Used for currency derivation (CRITICAL for Quote-to-Cash)
 */
export interface CountryLocale {
  country_code: string;
  currency: string; // EUR, AED, MAD, etc.
  currency_symbol: string | null;
  primary_locale: string; // fr-FR, en-AE, etc.
  timezone: string | null;
}

/**
 * Combined country + locale data
 * This is what QuoteForm needs to:
 * 1. Determine currency from Lead.country_code
 * 2. Filter catalogue by country
 */
export interface CountryWithLocale {
  country: CountryData;
  locale: CountryLocale | null;
}

// ============================================
// LEAD WITH RELATIONS
// ============================================

/**
 * Lead with assigned employee and source
 * Used in list views and detail pages
 */
export interface LeadWithRelations extends crm_leads {
  adm_provider_employees_crm_leads_assigned_toToadm_provider_employees: Pick<
    adm_provider_employees,
    "id" | "first_name" | "last_name" | "email"
  > | null;
  crm_lead_sources: Pick<crm_lead_sources, "id" | "name_translations"> | null;
}

/**
 * Lead with country data (for currency derivation)
 * CRITICAL: This is how we get the currency for Quotes
 *
 * Flow: Lead.country_code → crm_countries (GDPR, operational)
 *                        → dir_country_locales (currency, locale)
 *
 * Note: crm_countries and dir_country_locales are NOT linked via FK in Prisma.
 * They share country_code as unique key and are joined manually.
 */
export interface LeadWithCountry extends crm_leads {
  /** Country data from crm_countries (GDPR, operational status) */
  crm_countries: crm_countries | null;
  /** Locale data from dir_country_locales (currency, locale) - joined manually */
  country_locale: Pick<
    dir_country_locales,
    "currency" | "currency_symbol" | "primary_locale" | "timezone"
  > | null;
}

// ============================================
// OPPORTUNITY (Summary for Lead360)
// ============================================

/**
 * Opportunity summary for Lead 360 view
 * Contains only what's needed for display, NOT full entity
 */
export interface OpportunitySummary {
  id: string;
  stage: string;
  status: string;
  expected_value: number | null;
  currency: string | null;
  probability_percent: number | null;
  expected_close_date: Date | null;
  won_date: Date | null;
  lost_date: Date | null;
  created_at: Date;
  pipeline_name_translations?: Record<string, string> | null;
}

// ============================================
// QUOTE (Summary for Lead360)
// ============================================

/**
 * Quote summary for Lead 360 view
 */
export interface QuoteSummary {
  id: string;
  quote_number: string;
  status: string;
  subtotal: number;
  discount_amount: number | null;
  total_amount: number;
  currency: string;
  valid_until: Date | null;
  created_at: Date;
  opportunity_id: string;
}

// ============================================
// TIMELINE
// ============================================

/**
 * Timeline entry types
 */
export type TimelineEntryType =
  | "lead_created"
  | "lead_updated"
  | "status_changed"
  | "stage_changed"
  | "assigned"
  | "activity_added"
  | "opportunity_created"
  | "quote_created"
  | "quote_sent"
  | "note_added"
  | "email_sent"
  | "call_logged"
  | "meeting_scheduled";

/**
 * Single timeline entry
 * Aggregates activities, status changes, opportunities, quotes
 */
export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  created_by: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  // For opportunity/quote entries
  entity_id?: string;
  entity_type?: "opportunity" | "quote" | "activity";
}

// ============================================
// LEAD 360 VIEW (Main Composite Type)
// ============================================

/**
 * Complete Lead 360 View
 *
 * This is the SINGLE composite type used by:
 * - LeadBrowser component
 * - Lead detail page
 * - Any view that needs full prospect context
 *
 * PRINCIPLE: All data flows FROM Lead (Golden Record)
 * Opportunities and Quotes are linked via FK, not copied
 */
export interface Lead360View {
  /** Lead data with country/locale for currency */
  lead: LeadWithCountry;

  /** Derived currency from Lead.country_code → dir_country_locales */
  currency: string | null;

  /** All opportunities linked to this Lead */
  opportunities: OpportunitySummary[];

  /** All quotes linked to this Lead (via opportunities) */
  quotes: QuoteSummary[];

  /** Aggregated timeline (activities + status changes + ops + quotes) */
  timeline: TimelineEntry[];

  /** Scoring breakdown */
  scoring: {
    fit_score: number | null;
    engagement_score: number | null;
    qualification_score: number | null;
  };

  /** Statistics */
  stats: {
    total_opportunities: number;
    open_opportunities: number;
    won_opportunities: number;
    total_quotes: number;
    total_pipeline_value: number;
    total_won_value: number;
  };
}

// ============================================
// SERVICE RESPONSE TYPES
// ============================================

/**
 * Response from LeadService.getCountryData()
 * Used by QuoteForm to get currency and locale
 */
export interface LeadCountryDataResult {
  success: boolean;
  data?: {
    country_code: string;
    currency: string;
    currency_symbol: string | null;
    primary_locale: string;
    is_gdpr: boolean;
    is_operational: boolean;
  };
  error?: string;
}

/**
 * Response from CatalogueService.getFullCatalogue()
 * Filtered by country_code
 */
export interface CatalogueResult {
  plans: CataloguePlan[];
  addons: CatalogueAddon[];
  services: CatalogueService[];
}

export interface CataloguePlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  base_price: number;
  currency: string;
  billing_interval: string;
  max_vehicles: number | null;
  max_drivers: number | null;
  features: unknown;
}

export interface CatalogueAddon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  is_recurring: boolean;
  billing_interval: string | null;
  category: string | null;
}

export interface CatalogueService {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  service_type: string;
  hourly_rate: number | null;
  min_hours: number | null;
  category: string | null;
}
