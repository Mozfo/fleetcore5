// Email service type definitions
import {
  flt_vehicles,
  rid_drivers,
  doc_documents,
  flt_vehicle_maintenance,
} from "@prisma/client";

// Supported locales for email templates
export type EmailLocale = "en" | "fr";

// Email template types
export type EmailTemplate =
  | "vehicle-created"
  | "insurance-expiry"
  | "driver-onboarding"
  | "document-expiry"
  | "maintenance-reminder"
  | "driver-status-changed";

// Base email options
export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  locale?: EmailLocale;
  tenantId?: string;
}

// Vehicle created email data
export interface VehicleCreatedEmailData extends EmailOptions {
  vehicle: flt_vehicles;
  tenantName?: string;
}

// Insurance expiry alert email data
export interface InsuranceExpiryEmailData extends EmailOptions {
  vehicle: flt_vehicles;
  daysUntilExpiry: number;
}

// Driver onboarding email data
export interface DriverOnboardingEmailData extends EmailOptions {
  driver: rid_drivers;
  tenantName?: string;
  tempPassword?: string;
  loginUrl?: string;
}

// Document expiry alert email data
export interface DocumentExpiryEmailData extends EmailOptions {
  document: doc_documents;
  entityType: string;
  entityName: string;
  daysUntilExpiry: number;
}

// Maintenance reminder email data
export interface MaintenanceReminderEmailData extends EmailOptions {
  vehicle: flt_vehicles;
  maintenance: flt_vehicle_maintenance;
  scheduledDate: Date;
}

// Email send result
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email template data
export interface EmailTemplateData {
  subject: string;
  html: string;
  text?: string;
}

// Email configuration
export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  isDevelopment?: boolean;
}

// Template context for rendering
export interface TemplateContext {
  locale: EmailLocale;
  data: Record<string, unknown>;
}

// Email tracking data for audit
export interface EmailAuditData {
  template: EmailTemplate;
  recipient: string | string[];
  subject: string;
  status: "sent" | "failed";
  messageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Batch email result
export interface BatchEmailResult {
  successful: number;
  failed: number;
  results: EmailSendResult[];
}

// Template translations
export interface EmailTranslations {
  en: Record<string, string>;
  fr: Record<string, string>;
}
