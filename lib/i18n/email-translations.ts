/**
 * Email Template Translations
 *
 * Centralized translations for all email templates.
 * Supports EN, FR, AR with RTL detection.
 *
 * @module lib/i18n/email-translations
 */

export type EmailLocale = "en" | "fr" | "ar";

export const RTL_LOCALES: EmailLocale[] = ["ar"];

/**
 * Check if locale is RTL
 */
export function isRtlLocale(locale: EmailLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: EmailLocale): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

/**
 * Get text alignment for locale
 */
export function getTextAlign(locale: EmailLocale): "left" | "right" {
  return isRtlLocale(locale) ? "right" : "left";
}

// ============================================================================
// COMMON TRANSLATIONS
// ============================================================================

export const commonTranslations = {
  en: {
    greeting: "Hello",
    regards: "Best regards,",
    team: "The FleetCore Team",
    footer: "© 2025 FleetCore. All rights reserved.",
    viewDetails: "View Details",
    accessDashboard: "Access Dashboard",
  },
  fr: {
    greeting: "Bonjour",
    regards: "Cordialement,",
    team: "L'équipe FleetCore",
    footer: "© 2025 FleetCore. Tous droits réservés.",
    viewDetails: "Voir les détails",
    accessDashboard: "Accéder au tableau de bord",
  },
  ar: {
    greeting: "مرحباً",
    regards: "مع أطيب التحيات،",
    team: "فريق FleetCore",
    footer: "© 2025 FleetCore. جميع الحقوق محفوظة.",
    viewDetails: "عرض التفاصيل",
    accessDashboard: "الوصول إلى لوحة التحكم",
  },
} as const;

// ============================================================================
// LEAD CONFIRMATION
// ============================================================================

export const leadConfirmationTranslations = {
  en: {
    preview: "We will contact you within 24 hours",
    thankYou:
      "Thank you for requesting a demo of FleetCore! We have received your request and will contact you within 24 hours.",
    requestDetails: "Your request details:",
    company: "Company",
    fleetSize: "Fleet size",
    country: "Country",
    phone: "Phone",
    message: "Message",
  },
  fr: {
    preview: "Nous vous contacterons dans les 24 heures",
    thankYou:
      "Merci d'avoir demandé une démonstration de FleetCore ! Nous avons bien reçu votre demande et vous contacterons dans les 24 heures.",
    requestDetails: "Détails de votre demande :",
    company: "Entreprise",
    fleetSize: "Taille de flotte",
    country: "Pays",
    phone: "Téléphone",
    message: "Message",
  },
  ar: {
    preview: "سنتواصل معك خلال 24 ساعة",
    thankYou:
      "شكراً لك على طلب عرض توضيحي من FleetCore! لقد تلقينا طلبك وسنتواصل معك خلال 24 ساعة.",
    requestDetails: "تفاصيل طلبك:",
    company: "الشركة",
    fleetSize: "حجم الأسطول",
    country: "الدولة",
    phone: "الهاتف",
    message: "الرسالة",
  },
} as const;

// ============================================================================
// EXPANSION OPPORTUNITY
// ============================================================================

export const expansionOpportunityTranslations = {
  en: {
    preview: "Thank you for your interest - We'll notify you when we launch",
    thankYou:
      "Thank you for your interest in FleetCore! We appreciate you taking the time to request a demo.",
    notYetAvailable: "FleetCore is not yet available in",
    expanding:
      ", but we're expanding rapidly and your interest is extremely valuable to us. We've recorded your details and you'll be among the first to know when we launch in your market.",
    requestDetails: "Your request details:",
    company: "Company",
    fleetSize: "Fleet size",
    country: "Country",
    phone: "Phone",
    message: "Message",
    notifyButton: "Get Notified When We Launch",
    meanwhile:
      "In the meantime, feel free to explore our website to learn more about how FleetCore is revolutionizing fleet management.",
  },
  fr: {
    preview:
      "Merci de votre intérêt - Nous vous informerons de notre lancement",
    thankYou:
      "Merci de votre intérêt pour FleetCore ! Nous apprécions que vous ayez pris le temps de demander une démo.",
    notYetAvailable: "FleetCore n'est pas encore disponible",
    expanding:
      ", mais nous nous développons rapidement et votre intérêt nous est très précieux. Nous avons enregistré vos coordonnées et vous serez parmi les premiers informés de notre lancement sur votre marché.",
    requestDetails: "Détails de votre demande :",
    company: "Entreprise",
    fleetSize: "Taille de flotte",
    country: "Pays",
    phone: "Téléphone",
    message: "Message",
    notifyButton: "Être informé du lancement",
    meanwhile:
      "En attendant, n'hésitez pas à explorer notre site web pour en savoir plus sur la façon dont FleetCore révolutionne la gestion de flotte.",
  },
  ar: {
    preview: "شكراً لاهتمامك - سنبلغك عند إطلاقنا",
    thankYou:
      "شكراً لاهتمامك بـ FleetCore! نحن نقدر الوقت الذي استغرقته لطلب عرض توضيحي.",
    notYetAvailable: "FleetCore غير متوفر بعد في",
    expanding:
      "، لكننا نتوسع بسرعة واهتمامك قيم جداً بالنسبة لنا. لقد سجلنا بياناتك وستكون من أوائل من يعلم عند إطلاقنا في سوقك.",
    requestDetails: "تفاصيل طلبك:",
    company: "الشركة",
    fleetSize: "حجم الأسطول",
    country: "الدولة",
    phone: "الهاتف",
    message: "الرسالة",
    notifyButton: "أبلغني عند الإطلاق",
    meanwhile:
      "في غضون ذلك، لا تتردد في استكشاف موقعنا لمعرفة المزيد حول كيفية ثورة FleetCore في إدارة الأسطول.",
  },
} as const;

// ============================================================================
// MEMBER WELCOME
// ============================================================================

export const memberWelcomeTranslations = {
  en: {
    preview: "Welcome to {tenant_name} on FleetCore!",
    welcomeTo: "Welcome to",
    accountCreated:
      "! Your account has been created and you can now access FleetCore.",
    loginDetails: "Your login details:",
    email: "Email",
    role: "Role",
    dashboard: "Dashboard",
    nextSteps: "Next steps:",
    step1: "Complete your profile",
    step2: "Set up your preferences",
    step3: "Explore the dashboard",
    needHelp: "Need help? Contact your administrator or visit our Help Center.",
  },
  fr: {
    preview: "Bienvenue chez {tenant_name} sur FleetCore !",
    welcomeTo: "Bienvenue chez",
    accountCreated:
      " ! Votre compte a été créé et vous pouvez maintenant accéder à FleetCore.",
    loginDetails: "Vos informations de connexion :",
    email: "Email",
    role: "Rôle",
    dashboard: "Tableau de bord",
    nextSteps: "Prochaines étapes :",
    step1: "Compléter votre profil",
    step2: "Configurer vos préférences",
    step3: "Explorer le tableau de bord",
    needHelp:
      "Besoin d'aide ? Contactez votre administrateur ou visitez notre Centre d'aide.",
  },
  ar: {
    preview: "مرحباً بك في {tenant_name} على FleetCore!",
    welcomeTo: "مرحباً بك في",
    accountCreated: "! تم إنشاء حسابك ويمكنك الآن الوصول إلى FleetCore.",
    loginDetails: "تفاصيل تسجيل الدخول:",
    email: "البريد الإلكتروني",
    role: "الدور",
    dashboard: "لوحة التحكم",
    nextSteps: "الخطوات التالية:",
    step1: "أكمل ملفك الشخصي",
    step2: "قم بإعداد تفضيلاتك",
    step3: "استكشف لوحة التحكم",
    needHelp: "تحتاج مساعدة؟ تواصل مع المسؤول أو قم بزيارة مركز المساعدة.",
  },
} as const;

// ============================================================================
// MEMBER PASSWORD RESET
// ============================================================================

export const memberPasswordResetTranslations = {
  en: {
    preview: "Reset your FleetCore password",
    receivedRequest:
      "We received a request to reset your password for your FleetCore account.",
    clickButton: "Click the button below to reset your password:",
    resetButton: "Reset Password",
    linkExpiry: "This link will expire in",
    hours: "hours",
    didntRequest:
      "If you didn't request this password reset, please ignore this email or contact support if you have concerns.",
  },
  fr: {
    preview: "Réinitialiser votre mot de passe FleetCore",
    receivedRequest:
      "Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte FleetCore.",
    clickButton:
      "Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :",
    resetButton: "Réinitialiser le mot de passe",
    linkExpiry: "Ce lien expirera dans",
    hours: "heures",
    didntRequest:
      "Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email ou contacter le support si vous avez des préoccupations.",
  },
  ar: {
    preview: "إعادة تعيين كلمة مرور FleetCore",
    receivedRequest:
      "تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في FleetCore.",
    clickButton: "انقر على الزر أدناه لإعادة تعيين كلمة المرور:",
    resetButton: "إعادة تعيين كلمة المرور",
    linkExpiry: "سينتهي هذا الرابط خلال",
    hours: "ساعة",
    didntRequest:
      "إذا لم تطلب إعادة تعيين كلمة المرور هذه، يرجى تجاهل هذا البريد أو التواصل مع الدعم إذا كانت لديك مخاوف.",
  },
} as const;

// ============================================================================
// SALES REP ASSIGNMENT
// ============================================================================

export const salesRepAssignmentTranslations = {
  en: {
    preview: "New {priority} priority lead assigned",
    newLead: "A new",
    priorityLead: "priority lead has been assigned to you:",
    fleetSize: "Fleet size",
    country: "Country",
    qualificationScore: "Qualification score",
    fitScore: "Fit score",
    stage: "Stage",
    viewButton: "View Lead Details",
  },
  fr: {
    preview: "Nouveau lead priorité {priority} assigné",
    newLead: "Un nouveau lead de priorité",
    priorityLead: "vous a été assigné :",
    fleetSize: "Taille de flotte",
    country: "Pays",
    qualificationScore: "Score de qualification",
    fitScore: "Score d'adéquation",
    stage: "Étape",
    viewButton: "Voir les détails du lead",
  },
  ar: {
    preview: "تم تعيين lead جديد بأولوية {priority}",
    newLead: "تم تعيين lead جديد بأولوية",
    priorityLead: "لك:",
    fleetSize: "حجم الأسطول",
    country: "الدولة",
    qualificationScore: "درجة التأهيل",
    fitScore: "درجة الملاءمة",
    stage: "المرحلة",
    viewButton: "عرض تفاصيل Lead",
  },
} as const;

// ============================================================================
// LEAD FOLLOWUP
// ============================================================================

export const leadFollowupTranslations = {
  en: {
    preview: "Don't miss your FleetCore demo",
    noticed:
      "We noticed you requested a demo of FleetCore 2 days ago. We'd love to show you how FleetCore can help optimize your fleet operations.",
    helpsTo: "Our fleet management platform helps {company_name} to:",
    benefit1: "Reduce fuel costs by up to 20%",
    benefit2: "Automate driver payouts and reporting",
    benefit3: "Track vehicles and drivers in real-time",
    benefit4: "Manage multi-platform operations (Uber, Bolt, Careem)",
    bookButton: "Book Your Personalized Demo",
  },
  fr: {
    preview: "Ne manquez pas votre démo FleetCore",
    noticed:
      "Nous avons remarqué que vous avez demandé une démo de FleetCore il y a 2 jours. Nous serions ravis de vous montrer comment FleetCore peut optimiser vos opérations de flotte.",
    helpsTo: "Notre plateforme de gestion de flotte aide {company_name} à :",
    benefit1: "Réduire les coûts de carburant jusqu'à 20%",
    benefit2: "Automatiser les paiements et rapports des chauffeurs",
    benefit3: "Suivre les véhicules et chauffeurs en temps réel",
    benefit4: "Gérer les opérations multi-plateformes (Uber, Bolt, Careem)",
    bookButton: "Réserver votre démo personnalisée",
  },
  ar: {
    preview: "لا تفوت عرض FleetCore التوضيحي",
    noticed:
      "لاحظنا أنك طلبت عرضاً توضيحياً من FleetCore منذ يومين. نود أن نريك كيف يمكن لـ FleetCore تحسين عمليات أسطولك.",
    helpsTo: "منصة إدارة الأسطول لدينا تساعد {company_name} على:",
    benefit1: "تقليل تكاليف الوقود بنسبة تصل إلى 20%",
    benefit2: "أتمتة مدفوعات وتقارير السائقين",
    benefit3: "تتبع المركبات والسائقين في الوقت الفعلي",
    benefit4: "إدارة العمليات متعددة المنصات (Uber, Bolt, Careem)",
    bookButton: "احجز عرضك التوضيحي المخصص",
  },
} as const;

// ============================================================================
// VEHICLE INSPECTION REMINDER
// ============================================================================

export const vehicleInspectionReminderTranslations = {
  en: {
    preview: "Vehicle inspection due soon: {vehicle_plate}",
    reminder: "This is a reminder that vehicle inspection is due soon for:",
    plate: "Plate",
    dueDate: "Due date",
    daysRemaining: "Days remaining",
    pleaseSchedule:
      "Please schedule the inspection to avoid service disruption.",
    bookButton: "Book Inspection",
    operations: "FleetCore Operations",
  },
  fr: {
    preview: "Inspection véhicule à venir : {vehicle_plate}",
    reminder:
      "Ceci est un rappel que l'inspection du véhicule est bientôt due pour :",
    plate: "Immatriculation",
    dueDate: "Date limite",
    daysRemaining: "Jours restants",
    pleaseSchedule:
      "Veuillez planifier l'inspection pour éviter toute interruption de service.",
    bookButton: "Réserver l'inspection",
    operations: "FleetCore Operations",
  },
  ar: {
    preview: "فحص المركبة قريباً: {vehicle_plate}",
    reminder: "هذا تذكير بأن فحص المركبة مستحق قريباً لـ:",
    plate: "اللوحة",
    dueDate: "تاريخ الاستحقاق",
    daysRemaining: "الأيام المتبقية",
    pleaseSchedule: "يرجى جدولة الفحص لتجنب انقطاع الخدمة.",
    bookButton: "حجز الفحص",
    operations: "عمليات FleetCore",
  },
} as const;

// ============================================================================
// INSURANCE EXPIRY ALERT
// ============================================================================

export const insuranceExpiryAlertTranslations = {
  en: {
    preview: "Insurance expiring soon: {vehicle_plate}",
    urgent: "URGENT",
    expiringTitle: "Vehicle insurance is expiring soon!",
    plate: "Plate",
    expiryDate: "Expiry date",
    daysRemaining: "Days remaining",
    provider: "Insurance provider",
    policyNumber: "Policy number",
    actionRequired: "ACTION REQUIRED:",
    renewMessage:
      "Renew insurance immediately to maintain compliance and avoid service interruption.",
    compliance: "FleetCore Compliance Team",
  },
  fr: {
    preview: "Assurance expire bientôt : {vehicle_plate}",
    urgent: "URGENT",
    expiringTitle: "L'assurance du véhicule expire bientôt !",
    plate: "Immatriculation",
    expiryDate: "Date d'expiration",
    daysRemaining: "Jours restants",
    provider: "Assureur",
    policyNumber: "Numéro de police",
    actionRequired: "ACTION REQUISE :",
    renewMessage:
      "Renouvelez l'assurance immédiatement pour maintenir la conformité et éviter l'interruption de service.",
    compliance: "Équipe Conformité FleetCore",
  },
  ar: {
    preview: "التأمين ينتهي قريباً: {vehicle_plate}",
    urgent: "عاجل",
    expiringTitle: "تأمين المركبة ينتهي قريباً!",
    plate: "اللوحة",
    expiryDate: "تاريخ الانتهاء",
    daysRemaining: "الأيام المتبقية",
    provider: "شركة التأمين",
    policyNumber: "رقم الوثيقة",
    actionRequired: "إجراء مطلوب:",
    renewMessage: "جدد التأمين فوراً للحفاظ على الامتثال وتجنب انقطاع الخدمة.",
    compliance: "فريق الامتثال FleetCore",
  },
} as const;

// ============================================================================
// MAINTENANCE SCHEDULED
// ============================================================================

export const maintenanceScheduledTranslations = {
  en: {
    preview: "Maintenance scheduled: {vehicle_plate} on {maintenance_date}",
    scheduled: "Maintenance has been scheduled for your vehicle.",
    plate: "Plate",
    date: "Date",
    time: "Time",
    location: "Location",
    type: "Type",
    duration: "Estimated duration",
    planAccordingly:
      "Please plan accordingly and ensure the vehicle is available.",
    maintenance: "FleetCore Maintenance Team",
  },
  fr: {
    preview: "Maintenance planifiée : {vehicle_plate} le {maintenance_date}",
    scheduled: "Une maintenance a été planifiée pour votre véhicule.",
    plate: "Immatriculation",
    date: "Date",
    time: "Heure",
    location: "Lieu",
    type: "Type",
    duration: "Durée estimée",
    planAccordingly:
      "Veuillez planifier en conséquence et vous assurer que le véhicule est disponible.",
    maintenance: "Équipe Maintenance FleetCore",
  },
  ar: {
    preview: "صيانة مجدولة: {vehicle_plate} في {maintenance_date}",
    scheduled: "تم جدولة صيانة لمركبتك.",
    plate: "اللوحة",
    date: "التاريخ",
    time: "الوقت",
    location: "الموقع",
    type: "النوع",
    duration: "المدة المقدرة",
    planAccordingly: "يرجى التخطيط وفقاً لذلك والتأكد من توفر المركبة.",
    maintenance: "فريق الصيانة FleetCore",
  },
} as const;

// ============================================================================
// DRIVER ONBOARDING
// ============================================================================

export const driverOnboardingTranslations = {
  en: {
    preview: "Welcome to {fleet_name} - Get started as a driver",
    welcomeTo: "Welcome to",
    excited: "! We're excited to have you join our team.",
    accountCreated: "Your driver account has been created:",
    driverId: "Driver ID",
    startDate: "Start date",
    fleetManager: "Fleet manager",
    nextSteps: "Next steps:",
    step1: "Download the driver app",
    step2: "Upload required documents (license, insurance)",
    step3: "Complete platform onboarding (Uber, Bolt, Careem)",
    step4: "Review payout schedule and rates",
    accessButton: "Access Driver Portal",
    needHelp: "Need help? Contact your fleet manager or support.",
    teamSuffix: "Team",
  },
  fr: {
    preview: "Bienvenue chez {fleet_name} - Commencez en tant que chauffeur",
    welcomeTo: "Bienvenue chez",
    excited: " ! Nous sommes ravis de vous accueillir dans notre équipe.",
    accountCreated: "Votre compte chauffeur a été créé :",
    driverId: "ID Chauffeur",
    startDate: "Date de début",
    fleetManager: "Gestionnaire de flotte",
    nextSteps: "Prochaines étapes :",
    step1: "Télécharger l'application chauffeur",
    step2: "Téléverser les documents requis (permis, assurance)",
    step3: "Compléter l'intégration plateforme (Uber, Bolt, Careem)",
    step4: "Consulter le calendrier de paiement et les tarifs",
    accessButton: "Accéder au portail chauffeur",
    needHelp:
      "Besoin d'aide ? Contactez votre gestionnaire de flotte ou le support.",
    teamSuffix: "Équipe",
  },
  ar: {
    preview: "مرحباً بك في {fleet_name} - ابدأ كسائق",
    welcomeTo: "مرحباً بك في",
    excited: "! نحن متحمسون لانضمامك إلى فريقنا.",
    accountCreated: "تم إنشاء حساب السائق الخاص بك:",
    driverId: "معرف السائق",
    startDate: "تاريخ البدء",
    fleetManager: "مدير الأسطول",
    nextSteps: "الخطوات التالية:",
    step1: "تحميل تطبيق السائق",
    step2: "رفع المستندات المطلوبة (الرخصة، التأمين)",
    step3: "إكمال التسجيل في المنصات (Uber, Bolt, Careem)",
    step4: "مراجعة جدول الدفع والأسعار",
    accessButton: "الوصول إلى بوابة السائق",
    needHelp: "تحتاج مساعدة؟ تواصل مع مدير الأسطول أو الدعم.",
    teamSuffix: "فريق",
  },
} as const;

// ============================================================================
// CRITICAL ALERT
// ============================================================================

export const criticalAlertTranslations = {
  en: {
    preview: "CRITICAL: {alert_title}",
    badge: "CRITICAL ALERT",
    time: "Time",
    severity: "Severity",
    affected: "Affected",
    description: "Description:",
    recommendedAction: "Recommended action:",
    viewButton: "View Full Details",
    automated:
      "This is an automated critical alert from FleetCore. Please respond immediately.",
    monitoring: "FleetCore Monitoring Team",
  },
  fr: {
    preview: "CRITIQUE : {alert_title}",
    badge: "ALERTE CRITIQUE",
    time: "Heure",
    severity: "Sévérité",
    affected: "Affectés",
    description: "Description :",
    recommendedAction: "Action recommandée :",
    viewButton: "Voir tous les détails",
    automated:
      "Ceci est une alerte critique automatique de FleetCore. Veuillez répondre immédiatement.",
    monitoring: "Équipe Monitoring FleetCore",
  },
  ar: {
    preview: "حرج: {alert_title}",
    badge: "تنبيه حرج",
    time: "الوقت",
    severity: "الخطورة",
    affected: "المتأثرون",
    description: "الوصف:",
    recommendedAction: "الإجراء الموصى به:",
    viewButton: "عرض التفاصيل الكاملة",
    automated: "هذا تنبيه حرج تلقائي من FleetCore. يرجى الاستجابة فوراً.",
    monitoring: "فريق المراقبة FleetCore",
  },
} as const;

// ============================================================================
// EMAIL VERIFICATION CODE (V6.2.2 - Book Demo Wizard)
// ============================================================================

export const emailVerificationCodeTranslations = {
  en: {
    preview: "Your FleetCore verification code",
    title: "Your verification code",
    codeLabel: "Enter this code to continue booking your demo:",
    expires: "This code expires in {{minutes}} minutes",
    ignore:
      "If you didn't request this code, you can safely ignore this email.",
  },
  fr: {
    preview: "Votre code de vérification FleetCore",
    title: "Votre code de vérification",
    codeLabel: "Entrez ce code pour continuer votre réservation de démo :",
    expires: "Ce code expire dans {{minutes}} minutes",
    ignore:
      "Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.",
  },
  ar: {
    preview: "رمز التحقق من FleetCore",
    title: "رمز التحقق الخاص بك",
    codeLabel: "أدخل هذا الرمز لمتابعة حجز العرض التوضيحي:",
    expires: "ينتهي هذا الرمز خلال {{minutes}} دقيقة",
    ignore: "إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني.",
  },
} as const;

// ============================================================================
// CUSTOMER VERIFICATION (V6.2-8.5)
// ============================================================================

export const customerVerificationTranslations = {
  en: {
    preview: "Complete your FleetCore account setup",
    paymentSuccess: "Payment successful!",
    thankYou: "Thank you for choosing FleetCore.",
    yourAccountCode: "Your account code",
    nextStep: "One last step to activate your account:",
    instructions:
      "Please complete your company information and designate an administrator who will receive an invitation to set up the account.",
    completeButton: "Complete My Registration",
    expiresIn: "This link expires in",
    hours: "hours",
    needHelp: "Need help? Contact us at",
    warning: "Important: You must complete this step to access FleetCore.",
  },
  fr: {
    preview: "Finalisez votre compte FleetCore",
    paymentSuccess: "Paiement réussi !",
    thankYou: "Merci d'avoir choisi FleetCore.",
    yourAccountCode: "Votre code client",
    nextStep: "Une dernière étape pour activer votre compte :",
    instructions:
      "Veuillez compléter les informations de votre entreprise et désigner un administrateur qui recevra une invitation pour configurer le compte.",
    completeButton: "Compléter mon inscription",
    expiresIn: "Ce lien expire dans",
    hours: "heures",
    needHelp: "Besoin d'aide ? Contactez-nous à",
    warning:
      "Important : Vous devez compléter cette étape pour accéder à FleetCore.",
  },
  ar: {
    preview: "أكمل إعداد حسابك في FleetCore",
    paymentSuccess: "تم الدفع بنجاح!",
    thankYou: "شكراً لاختيارك FleetCore.",
    yourAccountCode: "رمز حسابك",
    nextStep: "خطوة أخيرة لتفعيل حسابك:",
    instructions:
      "يرجى إكمال معلومات شركتك وتعيين مسؤول سيتلقى دعوة لإعداد الحساب.",
    completeButton: "إكمال تسجيلي",
    expiresIn: "ينتهي هذا الرابط خلال",
    hours: "ساعة",
    needHelp: "تحتاج مساعدة؟ تواصل معنا على",
    warning: "هام: يجب إكمال هذه الخطوة للوصول إلى FleetCore.",
  },
} as const;

// ============================================================================
// WEBHOOK TEST
// ============================================================================

export const webhookTestTranslations = {
  en: {
    preview: "FleetCore Webhook Test",
    testNotification: "This is a test notification from FleetCore.",
    timestamp: "Timestamp",
    testId: "Test ID",
    configuredCorrectly:
      "If you received this email, webhooks are configured correctly.",
    engineering: "FleetCore Engineering Team",
  },
  fr: {
    preview: "Test Webhook FleetCore",
    testNotification: "Ceci est une notification de test de FleetCore.",
    timestamp: "Horodatage",
    testId: "ID de test",
    configuredCorrectly:
      "Si vous avez reçu cet email, les webhooks sont correctement configurés.",
    engineering: "Équipe Ingénierie FleetCore",
  },
  ar: {
    preview: "اختبار Webhook FleetCore",
    testNotification: "هذا إشعار اختباري من FleetCore.",
    timestamp: "الطابع الزمني",
    testId: "معرف الاختبار",
    configuredCorrectly: "إذا تلقيت هذا البريد، فإن webhooks مُعدّة بشكل صحيح.",
    engineering: "فريق الهندسة FleetCore",
  },
} as const;

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Get translation for a specific template and locale
 */
export function getEmailTranslation<T extends Record<string, string>>(
  translations: Record<EmailLocale, T>,
  locale: EmailLocale,
  key: keyof T
): string {
  const localeTranslations = translations[locale];
  const fallbackTranslations = translations.en;
  return localeTranslations?.[key] || fallbackTranslations[key] || String(key);
}

/**
 * Get common translation
 */
export function getCommonTranslation(
  locale: EmailLocale,
  key: keyof typeof commonTranslations.en
): string {
  return commonTranslations[locale]?.[key] || commonTranslations.en[key];
}
