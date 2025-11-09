// Email service with Resend integration
import { Resend } from "resend";
import { BaseService } from "@/lib/core/base.service";
import { auditLog } from "@/lib/audit";
import type { rid_drivers } from "@prisma/client";
import type {
  EmailLocale,
  EmailTemplate,
  EmailSendResult,
  EmailTemplateData,
  VehicleCreatedEmailData,
  InsuranceExpiryEmailData,
  DriverOnboardingEmailData,
  DocumentExpiryEmailData,
  MaintenanceReminderEmailData,
  EmailTranslations,
} from "./email.types";

type Driver = rid_drivers;

export class EmailService extends BaseService {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;
  private replyTo: string;
  private isDevelopment: boolean;

  // Translations for email subjects and content
  private translations: EmailTranslations = {
    en: {
      // Common
      greeting: "Hello",
      regards: "Best regards",
      team: "FleetCore Team",
      footer:
        "This is an automated message from FleetCore. Please do not reply directly to this email.",

      // Vehicle Created
      vehicleCreatedSubject: "New Vehicle Added to Fleet",
      vehicleAddedTo: "A new vehicle has been added to",
      vehicleDetails: "Vehicle Details",
      plateNumber: "Plate Number",
      brand: "Brand",
      model: "Model",
      year: "Year",
      requiredActions: "Required Actions",
      uploadDocuments: "Upload required documents",
      scheduleInspection: "Schedule initial inspection",
      assignDriver: "Assign a driver",

      // Insurance Expiry
      insuranceExpirySubject: "Insurance Expiry Alert",
      insuranceExpiring: "Vehicle insurance is expiring soon",
      daysRemaining: "Days remaining",
      pleaseRenew:
        "Please renew the insurance before expiry to avoid service interruption.",

      // Driver Onboarding
      driverOnboardingSubject: "Welcome to FleetCore",
      welcomeMessage: "Welcome to the fleet management platform",
      accountCreated: "Your account has been successfully created.",
      loginInstructions: "Login Instructions",
      emailLabel: "Email",
      temporaryPassword: "Temporary Password",
      loginButton: "Login to FleetCore",
      changePasswordNote: "Please change your password after first login.",

      // Document Expiry
      documentExpirySubject: "Document Expiry Alert",
      documentExpiring: "A document is expiring soon",
      documentType: "Document Type",
      associatedWith: "Associated with",
      expiryDate: "Expiry Date",
      actionRequired: "Please renew this document before expiry.",

      // Maintenance Reminder
      maintenanceSubject: "Scheduled Maintenance Reminder",
      maintenanceScheduled: "Maintenance is scheduled for",
      maintenanceType: "Maintenance Type",
      scheduledDate: "Scheduled Date",
      vehicleInfo: "Vehicle Information",
      pleaseConfirm: "Please confirm the appointment or reschedule if needed.",

      // Driver Status Changed
      driverSuspendedSubject: "Account Suspended",
      driverReactivatedSubject: "Account Reactivated",
      driverTerminatedSubject: "Account Terminated",
      accountSuspended: "Your driver account has been suspended",
      accountReactivated: "Your driver account has been reactivated",
      accountTerminated: "Your driver account has been terminated",
      statusChangeReason: "Reason",
      effectiveImmediately: "This change is effective immediately.",
      contactSupport: "If you have questions, please contact support.",
      welcomeBack: "Welcome back! You can now resume your activities.",
    },
    fr: {
      // Common
      greeting: "Bonjour",
      regards: "Cordialement",
      team: "L'équipe FleetCore",
      footer:
        "Ceci est un message automatique de FleetCore. Merci de ne pas répondre directement à cet email.",

      // Vehicle Created
      vehicleCreatedSubject: "Nouveau véhicule ajouté à la flotte",
      vehicleAddedTo: "Un nouveau véhicule a été ajouté à",
      vehicleDetails: "Détails du véhicule",
      plateNumber: "Numéro d'immatriculation",
      brand: "Marque",
      model: "Modèle",
      year: "Année",
      requiredActions: "Actions requises",
      uploadDocuments: "Télécharger les documents requis",
      scheduleInspection: "Planifier l'inspection initiale",
      assignDriver: "Assigner un conducteur",

      // Insurance Expiry
      insuranceExpirySubject: "Alerte d'expiration d'assurance",
      insuranceExpiring: "L'assurance du véhicule expire bientôt",
      daysRemaining: "Jours restants",
      pleaseRenew:
        "Veuillez renouveler l'assurance avant l'expiration pour éviter l'interruption du service.",

      // Driver Onboarding
      driverOnboardingSubject: "Bienvenue sur FleetCore",
      welcomeMessage: "Bienvenue sur la plateforme de gestion de flotte",
      accountCreated: "Votre compte a été créé avec succès.",
      loginInstructions: "Instructions de connexion",
      emailLabel: "Email",
      temporaryPassword: "Mot de passe temporaire",
      loginButton: "Se connecter à FleetCore",
      changePasswordNote:
        "Veuillez changer votre mot de passe après la première connexion.",

      // Document Expiry
      documentExpirySubject: "Alerte d'expiration de document",
      documentExpiring: "Un document expire bientôt",
      documentType: "Type de document",
      associatedWith: "Associé à",
      expiryDate: "Date d'expiration",
      actionRequired: "Veuillez renouveler ce document avant l'expiration.",

      // Maintenance Reminder
      maintenanceSubject: "Rappel de maintenance programmée",
      maintenanceScheduled: "Une maintenance est programmée pour",
      maintenanceType: "Type de maintenance",
      scheduledDate: "Date prévue",
      vehicleInfo: "Informations du véhicule",
      pleaseConfirm:
        "Veuillez confirmer le rendez-vous ou reprogrammer si nécessaire.",

      // Driver Status Changed
      driverSuspendedSubject: "Compte suspendu",
      driverReactivatedSubject: "Compte réactivé",
      driverTerminatedSubject: "Compte résilié",
      accountSuspended: "Votre compte conducteur a été suspendu",
      accountReactivated: "Votre compte conducteur a été réactivé",
      accountTerminated: "Votre compte conducteur a été résilié",
      statusChangeReason: "Raison",
      effectiveImmediately: "Ce changement est effectif immédiatement.",
      contactSupport:
        "Si vous avez des questions, veuillez contacter le support.",
      welcomeBack:
        "Bon retour ! Vous pouvez maintenant reprendre vos activités.",
    },
  };

  constructor() {
    super();

    // Initialize Resend with API key from environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.EMAIL_FROM || "notifications@fleetcore.app";
    this.fromName = process.env.EMAIL_FROM_NAME || "FleetCore";
    this.replyTo = process.env.EMAIL_REPLY_TO || "support@fleetcore.app";
    // Allow forcing real email sending in development with FORCE_SEND_EMAILS=true
    this.isDevelopment =
      process.env.NODE_ENV === "development" &&
      process.env.FORCE_SEND_EMAILS !== "true";
  }

  /**
   * Send vehicle created notification
   */
  async sendVehicleCreated(
    vehicle: VehicleCreatedEmailData["vehicle"],
    tenantId: string,
    recipientEmail: string,
    locale: EmailLocale = "en"
  ): Promise<EmailSendResult> {
    const t = this.translations[locale];
    const tenantName = "Your Fleet"; // TODO: Get from tenant data

    const template = this.getVehicleCreatedTemplate(
      vehicle,
      tenantName,
      locale
    );

    return this.sendEmail({
      to: recipientEmail,
      subject: t.vehicleCreatedSubject,
      html: template.html,
      text: template.text,
      template: "vehicle-created",
      tenantId,
      metadata: {
        vehicleId: vehicle.id,
        plateNumber: vehicle.license_plate,
      },
    });
  }

  /**
   * Send insurance expiry alert
   */
  async sendInsuranceExpiryAlert(
    vehicle: InsuranceExpiryEmailData["vehicle"],
    daysUntilExpiry: number,
    recipientEmail: string,
    locale: EmailLocale = "en"
  ): Promise<EmailSendResult> {
    const t = this.translations[locale];

    const template = this.getInsuranceExpiryTemplate(
      vehicle,
      daysUntilExpiry,
      locale
    );

    return this.sendEmail({
      to: recipientEmail,
      subject: `${t.insuranceExpirySubject} - ${vehicle.license_plate}`,
      html: template.html,
      text: template.text,
      template: "insurance-expiry",
      tenantId: vehicle.tenant_id,
      metadata: {
        vehicleId: vehicle.id,
        daysUntilExpiry,
        expiryDate: vehicle.insurance_expiry,
      },
    });
  }

  /**
   * Send driver onboarding email
   */
  async sendDriverOnboarding(
    driver: DriverOnboardingEmailData["driver"],
    tenantId: string,
    tempPassword: string,
    locale: EmailLocale = "en"
  ): Promise<EmailSendResult> {
    const t = this.translations[locale];
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fleetcore.app";

    const template = this.getDriverOnboardingTemplate(
      driver,
      tempPassword,
      loginUrl,
      locale
    );

    return this.sendEmail({
      to: driver.email,
      subject: t.driverOnboardingSubject,
      html: template.html,
      text: template.text,
      template: "driver-onboarding",
      tenantId,
      metadata: {
        driverId: driver.id,
        driverName: `${driver.first_name} ${driver.last_name}`,
      },
    });
  }

  /**
   * Send document expiry alert
   */
  async sendDocumentExpiryAlert(
    document: DocumentExpiryEmailData["document"],
    entityName: string,
    tenantId: string,
    recipientEmail: string,
    daysUntilExpiry: number,
    locale: EmailLocale = "en"
  ): Promise<EmailSendResult> {
    const t = this.translations[locale];

    const template = this.getDocumentExpiryTemplate(
      document,
      entityName,
      daysUntilExpiry,
      locale
    );

    return this.sendEmail({
      to: recipientEmail,
      subject: `${t.documentExpirySubject} - ${document.document_type}`,
      html: template.html,
      text: template.text,
      template: "document-expiry",
      tenantId,
      metadata: {
        documentId: document.id,
        documentType: document.document_type,
        entityType: document.entity_type,
        entityId: document.entity_id,
      },
    });
  }

  /**
   * Send maintenance reminder
   */
  async sendMaintenanceReminder(
    vehicle: MaintenanceReminderEmailData["vehicle"],
    maintenance: MaintenanceReminderEmailData["maintenance"],
    tenantId: string,
    recipientEmail: string,
    locale: EmailLocale = "en"
  ): Promise<EmailSendResult> {
    const t = this.translations[locale];

    const template = this.getMaintenanceReminderTemplate(
      vehicle,
      maintenance,
      locale
    );

    return this.sendEmail({
      to: recipientEmail,
      subject: `${t.maintenanceSubject} - ${vehicle.license_plate}`,
      html: template.html,
      text: template.text,
      template: "maintenance-reminder",
      tenantId,
      metadata: {
        vehicleId: vehicle.id,
        maintenanceId: maintenance.id,
        maintenanceType: maintenance.maintenance_type,
      },
    });
  }

  /**
   * Send driver status changed notification
   */
  async sendDriverStatusChanged(
    driver: Driver,
    newStatus: "active" | "suspended" | "terminated",
    reason: string,
    tenantId: string,
    locale: EmailLocale = "en"
  ): Promise<EmailSendResult> {
    const t = this.translations[locale];

    // Get tenant name
    const tenant = await this.prisma.adm_tenants.findUnique({
      where: { id: tenantId },
    });
    const tenantName = tenant?.name || "FleetCore";

    // Determine subject based on status
    let subject: string;
    switch (newStatus) {
      case "suspended":
        subject = t.driverSuspendedSubject;
        break;
      case "active":
        subject = t.driverReactivatedSubject;
        break;
      case "terminated":
        subject = t.driverTerminatedSubject;
        break;
    }

    const template = this.getDriverStatusChangedTemplate(
      driver,
      newStatus,
      reason,
      tenantName,
      locale
    );

    return this.sendEmail({
      to: driver.email,
      subject,
      html: template.html,
      text: template.text,
      template: "driver-status-changed",
      tenantId,
      metadata: {
        driverId: driver.id,
        driverName: `${driver.first_name} ${driver.last_name}`,
        newStatus,
        reason,
      },
    });
  }

  /**
   * Core email sending method
   */
  private async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    template: EmailTemplate;
    tenantId: string;
    metadata?: Record<string, unknown>;
  }): Promise<EmailSendResult> {
    try {
      // In development, log email instead of sending
      if (this.isDevelopment) {
        // Log email details in development
        await auditLog({
          tenantId: params.tenantId,
          action: "export",
          entityType: "document",
          entityId: "email-dev",
          metadata: {
            ...params.metadata,
            template: params.template,
            recipient: params.to,
            subject: params.subject,
            isDevelopment: true,
          },
        });

        return {
          success: true,
          messageId: `dev-${Date.now()}`,
        };
      }

      // Send email via Resend
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: this.replyTo,
      });

      // Log successful email
      await auditLog({
        tenantId: params.tenantId,
        action: "export",
        entityType: "document",
        entityId: result.data?.id || "email",
        metadata: {
          ...params.metadata,
          template: params.template,
          recipient: params.to,
          subject: params.subject,
          messageId: result.data?.id,
          status: "sent",
        },
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      // Log failed email
      await auditLog({
        tenantId: params.tenantId,
        action: "export",
        entityType: "document",
        entityId: "email-error",
        metadata: {
          ...params.metadata,
          template: params.template,
          recipient: params.to,
          subject: params.subject,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  // Template generation methods (inline HTML)

  private getVehicleCreatedTemplate(
    vehicle: VehicleCreatedEmailData["vehicle"],
    tenantName: string,
    locale: EmailLocale
  ): EmailTemplateData {
    const t = this.translations[locale];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .details { background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
    .detail-row:last-child { border-bottom: none; }
    .actions { margin: 25px 0; }
    .action-item { padding: 10px; background: #f0f4f8; border-left: 4px solid #667eea; margin: 10px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${t.vehicleCreatedSubject}</h1>
    </div>
    <div class="content">
      <p>${t.greeting},</p>
      <p>${t.vehicleAddedTo} <strong>${tenantName}</strong>.</p>

      <div class="details">
        <h3>${t.vehicleDetails}</h3>
        <div class="detail-row">
          <span>${t.plateNumber}:</span>
          <strong>${vehicle.license_plate}</strong>
        </div>
        <div class="detail-row">
          <span>${t.brand}:</span>
          <strong>${vehicle.make_id || "N/A"}</strong>
        </div>
        <div class="detail-row">
          <span>${t.model}:</span>
          <strong>${vehicle.model_id || "N/A"}</strong>
        </div>
        <div class="detail-row">
          <span>${t.year}:</span>
          <strong>${vehicle.year}</strong>
        </div>
      </div>

      <div class="actions">
        <h3>${t.requiredActions}:</h3>
        <div class="action-item">📄 ${t.uploadDocuments}</div>
        <div class="action-item">🔍 ${t.scheduleInspection}</div>
        <div class="action-item">👤 ${t.assignDriver}</div>
      </div>

      <p>${t.regards},<br>${t.team}</p>

      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
${t.vehicleCreatedSubject}

${t.greeting},

${t.vehicleAddedTo} ${tenantName}.

${t.vehicleDetails}:
- ${t.plateNumber}: ${vehicle.license_plate}
- ${t.brand}: ${vehicle.make_id || "N/A"}
- ${t.model}: ${vehicle.model_id || "N/A"}
- ${t.year}: ${vehicle.year}

${t.requiredActions}:
- ${t.uploadDocuments}
- ${t.scheduleInspection}
- ${t.assignDriver}

${t.regards},
${t.team}

${t.footer}`;

    return { subject: t.vehicleCreatedSubject, html, text };
  }

  private getInsuranceExpiryTemplate(
    vehicle: InsuranceExpiryEmailData["vehicle"],
    daysUntilExpiry: number,
    locale: EmailLocale
  ): EmailTemplateData {
    const t = this.translations[locale];
    const urgency =
      daysUntilExpiry <= 7
        ? "urgent"
        : daysUntilExpiry <= 15
          ? "warning"
          : "info";
    const urgencyColor =
      urgency === "urgent"
        ? "#dc3545"
        : urgency === "warning"
          ? "#ffc107"
          : "#17a2b8";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${urgencyColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .alert.urgent { background: #f8d7da; border-color: #dc3545; }
    .countdown { font-size: 48px; font-weight: bold; color: ${urgencyColor}; text-align: center; margin: 20px 0; }
    .vehicle-info { background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ${t.insuranceExpirySubject}</h1>
    </div>
    <div class="content">
      <p>${t.greeting},</p>

      <div class="alert ${urgency === "urgent" ? "urgent" : ""}">
        <strong>${t.insuranceExpiring}!</strong>
      </div>

      <div class="countdown">
        ${daysUntilExpiry} ${t.daysRemaining}
      </div>

      <div class="vehicle-info">
        <strong>${t.vehicleDetails}:</strong><br>
        ${t.plateNumber}: ${vehicle.license_plate}<br>
        ${vehicle.make_id} ${vehicle.model_id} (${vehicle.year})
      </div>

      <p><strong>${t.pleaseRenew}</strong></p>

      <p>${t.regards},<br>${t.team}</p>

      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
${t.insuranceExpirySubject}

${t.greeting},

${t.insuranceExpiring}!

${daysUntilExpiry} ${t.daysRemaining}

${t.vehicleDetails}:
- ${t.plateNumber}: ${vehicle.license_plate}
- ${vehicle.make_id} ${vehicle.model_id} (${vehicle.year})

${t.pleaseRenew}

${t.regards},
${t.team}

${t.footer}`;

    return { subject: t.insuranceExpirySubject, html, text };
  }

  private getDriverOnboardingTemplate(
    driver: DriverOnboardingEmailData["driver"],
    tempPassword: string,
    loginUrl: string,
    locale: EmailLocale
  ): EmailTemplateData {
    const t = this.translations[locale];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .welcome { font-size: 24px; color: #667eea; margin: 20px 0; }
    .credentials { background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .credential-item { padding: 10px; margin: 10px 0; }
    .credential-label { color: #666; font-size: 14px; }
    .credential-value { font-size: 18px; font-weight: bold; color: #333; margin-top: 5px; }
    .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ${t.driverOnboardingSubject}</h1>
    </div>
    <div class="content">
      <p>${t.greeting} ${driver.first_name},</p>

      <div class="welcome">
        ${t.welcomeMessage}!
      </div>

      <p>${t.accountCreated}</p>

      <div class="credentials">
        <h3>${t.loginInstructions}:</h3>
        <div class="credential-item">
          <div class="credential-label">${t.emailLabel}:</div>
          <div class="credential-value">${driver.email}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">${t.temporaryPassword}:</div>
          <div class="credential-value">${tempPassword}</div>
        </div>
      </div>

      <div class="warning">
        ⚠️ ${t.changePasswordNote}
      </div>

      <center>
        <a href="${loginUrl}" class="button">${t.loginButton}</a>
      </center>

      <p>${t.regards},<br>${t.team}</p>

      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
${t.driverOnboardingSubject}

${t.greeting} ${driver.first_name},

${t.welcomeMessage}!

${t.accountCreated}

${t.loginInstructions}:
- ${t.emailLabel}: ${driver.email}
- ${t.temporaryPassword}: ${tempPassword}

${t.changePasswordNote}

${t.loginButton}: ${loginUrl}

${t.regards},
${t.team}

${t.footer}`;

    return { subject: t.driverOnboardingSubject, html, text };
  }

  private getDocumentExpiryTemplate(
    document: DocumentExpiryEmailData["document"],
    entityName: string,
    daysUntilExpiry: number,
    locale: EmailLocale
  ): EmailTemplateData {
    const t = this.translations[locale];
    const urgency =
      daysUntilExpiry <= 7
        ? "urgent"
        : daysUntilExpiry <= 15
          ? "warning"
          : "info";
    const urgencyColor =
      urgency === "urgent"
        ? "#dc3545"
        : urgency === "warning"
          ? "#ffc107"
          : "#17a2b8";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${urgencyColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .alert { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .alert.urgent { background: #f8d7da; border-color: #dc3545; }
    .document-info { background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
    .info-row:last-child { border-bottom: none; }
    .days-badge { display: inline-block; padding: 5px 15px; background: ${urgencyColor}; color: white; border-radius: 20px; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 ${t.documentExpirySubject}</h1>
    </div>
    <div class="content">
      <p>${t.greeting},</p>

      <div class="alert ${urgency === "urgent" ? "urgent" : ""}">
        <strong>${t.documentExpiring}</strong>
        <div style="margin-top: 10px;">
          <span class="days-badge">${daysUntilExpiry} ${t.daysRemaining}</span>
        </div>
      </div>

      <div class="document-info">
        <div class="info-row">
          <span>${t.documentType}:</span>
          <strong>${document.document_type.replace(/_/g, " ").toUpperCase()}</strong>
        </div>
        <div class="info-row">
          <span>${t.associatedWith}:</span>
          <strong>${entityName}</strong>
        </div>
        <div class="info-row">
          <span>${t.expiryDate}:</span>
          <strong>${document.expiry_date ? new Date(document.expiry_date).toLocaleDateString() : "N/A"}</strong>
        </div>
      </div>

      <p><strong>${t.actionRequired}</strong></p>

      <p>${t.regards},<br>${t.team}</p>

      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
${t.documentExpirySubject}

${t.greeting},

${t.documentExpiring}
${daysUntilExpiry} ${t.daysRemaining}

${t.documentType}: ${document.document_type.replace(/_/g, " ").toUpperCase()}
${t.associatedWith}: ${entityName}
${t.expiryDate}: ${document.expiry_date ? new Date(document.expiry_date).toLocaleDateString() : "N/A"}

${t.actionRequired}

${t.regards},
${t.team}

${t.footer}`;

    return { subject: t.documentExpirySubject, html, text };
  }

  private getMaintenanceReminderTemplate(
    vehicle: MaintenanceReminderEmailData["vehicle"],
    maintenance: MaintenanceReminderEmailData["maintenance"],
    locale: EmailLocale
  ): EmailTemplateData {
    const t = this.translations[locale];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .appointment { background: #e8f4f8; border: 2px solid #56ccf2; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .date-badge { font-size: 24px; font-weight: bold; color: #2f80ed; margin: 10px 0; }
    .details { background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
    .detail-row:last-child { border-bottom: none; }
    .action-required { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 ${t.maintenanceSubject}</h1>
    </div>
    <div class="content">
      <p>${t.greeting},</p>

      <div class="appointment">
        <strong>${t.maintenanceScheduled}</strong>
        <div class="date-badge">
          ${maintenance.scheduled_date ? new Date(maintenance.scheduled_date).toLocaleDateString() : "TBD"}
        </div>
      </div>

      <div class="details">
        <h3>${t.vehicleInfo}</h3>
        <div class="detail-row">
          <span>${t.plateNumber}:</span>
          <strong>${vehicle.license_plate}</strong>
        </div>
        <div class="detail-row">
          <span>${t.brand}/${t.model}:</span>
          <strong>${vehicle.make_id} ${vehicle.model_id}</strong>
        </div>
        <div class="detail-row">
          <span>${t.maintenanceType}:</span>
          <strong>${maintenance.maintenance_type.replace(/_/g, " ").toUpperCase()}</strong>
        </div>
      </div>

      <div class="action-required">
        📅 ${t.pleaseConfirm}
      </div>

      <p>${t.regards},<br>${t.team}</p>

      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
${t.maintenanceSubject}

${t.greeting},

${t.maintenanceScheduled}
${t.scheduledDate}: ${maintenance.scheduled_date ? new Date(maintenance.scheduled_date).toLocaleDateString() : "TBD"}

${t.vehicleInfo}:
- ${t.plateNumber}: ${vehicle.license_plate}
- ${vehicle.make_id} ${vehicle.model_id}
- ${t.maintenanceType}: ${maintenance.maintenance_type.replace(/_/g, " ").toUpperCase()}

${t.pleaseConfirm}

${t.regards},
${t.team}

${t.footer}`;

    return { subject: t.maintenanceSubject, html, text };
  }

  private getDriverStatusChangedTemplate(
    driver: Driver,
    newStatus: "active" | "suspended" | "terminated",
    reason: string,
    tenantName: string,
    locale: EmailLocale
  ): EmailTemplateData {
    const t = this.translations[locale];

    // Determine status-specific content
    let statusMessage: string;
    let statusColor: string;
    let statusIcon: string;

    switch (newStatus) {
      case "suspended":
        statusMessage = t.accountSuspended;
        statusColor = "#ffc107"; // Warning yellow
        statusIcon = "⚠️";
        break;
      case "active":
        statusMessage = t.accountReactivated;
        statusColor = "#28a745"; // Success green
        statusIcon = "✅";
        break;
      case "terminated":
        statusMessage = t.accountTerminated;
        statusColor = "#dc3545"; // Danger red
        statusIcon = "🚫";
        break;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 10px 10px; }
    .status-alert { background: ${newStatus === "active" ? "#d4edda" : "#fff3cd"}; border: 2px solid ${statusColor}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
    .status-alert.terminated { background: #f8d7da; }
    .status-message { font-size: 20px; font-weight: bold; color: ${statusColor}; margin: 10px 0; }
    .reason-box { background: #f7f7f7; padding: 20px; border-left: 4px solid ${statusColor}; border-radius: 5px; margin: 20px 0; }
    .reason-label { font-weight: bold; color: #666; margin-bottom: 10px; }
    .reason-text { color: #333; font-size: 16px; }
    .notice { background: #e8f4f8; border: 1px solid #17a2b8; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusIcon} ${newStatus === "suspended" ? t.driverSuspendedSubject : newStatus === "active" ? t.driverReactivatedSubject : t.driverTerminatedSubject}</h1>
    </div>
    <div class="content">
      <p>${t.greeting} ${driver.first_name},</p>

      <div class="status-alert ${newStatus === "terminated" ? "terminated" : ""}">
        <div class="status-message">${statusMessage}</div>
      </div>

      <div class="reason-box">
        <div class="reason-label">${t.statusChangeReason}:</div>
        <div class="reason-text">${reason}</div>
      </div>

      <div class="notice">
        ${t.effectiveImmediately}
      </div>

      ${newStatus === "active" ? `<p><strong>${t.welcomeBack}</strong></p>` : `<p>${t.contactSupport}</p>`}

      <p>${t.regards},<br>${t.team} - ${tenantName}</p>

      <div class="footer">
        <p>${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const text = `
${newStatus === "suspended" ? t.driverSuspendedSubject : newStatus === "active" ? t.driverReactivatedSubject : t.driverTerminatedSubject}

${t.greeting} ${driver.first_name},

${statusMessage}

${t.statusChangeReason}: ${reason}

${t.effectiveImmediately}

${newStatus === "active" ? t.welcomeBack : t.contactSupport}

${t.regards},
${t.team} - ${tenantName}

${t.footer}`;

    const subject =
      newStatus === "suspended"
        ? t.driverSuspendedSubject
        : newStatus === "active"
          ? t.driverReactivatedSubject
          : t.driverTerminatedSubject;

    return { subject, html, text };
  }

  // Public utility methods

  /**
   * Send generic email (for NotificationService and other consumers)
   * Public wrapper around private sendEmail() method
   */
  async send(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<EmailSendResult> {
    try {
      // In development, log email instead of sending
      if (this.isDevelopment) {
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
        };
      }

      // Send email via Resend
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: this.replyTo,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  /**
   * Send document expiry reminder (convenience wrapper)
   */
  async sendDocumentExpiryReminder(
    doc: DocumentExpiryEmailData["document"]
  ): Promise<EmailSendResult> {
    // TODO: Get entity details and recipient email
    const entityName = "Vehicle"; // Placeholder
    const recipientEmail = "admin@example.com"; // Placeholder

    // Calculate days until expiry
    const daysUntilExpiry = doc.expiry_date
      ? Math.floor(
          (new Date(doc.expiry_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 30;

    return this.sendDocumentExpiryAlert(
      doc,
      entityName,
      doc.tenant_id,
      recipientEmail,
      daysUntilExpiry,
      "en"
    );
  }

  /**
   * Send document expired notification
   */
  async sendDocumentExpired(
    doc: DocumentExpiryEmailData["document"]
  ): Promise<EmailSendResult> {
    // Similar to expiry reminder but with different urgency
    return this.sendDocumentExpiryReminder(doc);
  }
}
