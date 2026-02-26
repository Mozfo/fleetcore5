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
    footer: "© 2026 FleetCore. All rights reserved.",
    viewDetails: "View Details",
    accessDashboard: "Access Dashboard",
  },
  fr: {
    greeting: "Bonjour",
    regards: "Cordialement,",
    team: "L'équipe FleetCore",
    footer: "© 2026 FleetCore. Tous droits réservés.",
    viewDetails: "Voir les détails",
    accessDashboard: "Accéder au tableau de bord",
  },
  ar: {
    greeting: "مرحباً",
    regards: "مع أطيب التحيات،",
    team: "فريق FleetCore",
    footer: "© 2026 FleetCore. جميع الحقوق محفوظة.",
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
// CALLBACK CONFIRMATION (V6.6.1 - Wizard callback request)
// ============================================================================

export const callbackConfirmationTranslations = {
  en: {
    preview: "We'll call you back shortly",
    title: "We'll call you back!",
    thankYou:
      "Thank you for your interest in FleetCore! We've received your callback request and our team will reach out to you shortly.",
    requestDetails: "Your details:",
    company: "Company",
    fleetSize: "Fleet size",
    phone: "Phone",
    whatNext: "What happens next?",
    step1: "Our team will review your request shortly",
    step2: "A fleet expert will call you back as soon as possible",
    step3: "We'll prepare a demo tailored to your fleet size and needs",
  },
  fr: {
    preview: "Nous vous rappelons bientôt",
    title: "Nous vous rappelons !",
    thankYou:
      "Merci de votre intérêt pour FleetCore ! Nous avons bien reçu votre demande de rappel et notre équipe vous contactera très prochainement.",
    requestDetails: "Vos informations :",
    company: "Entreprise",
    fleetSize: "Taille de flotte",
    phone: "Téléphone",
    whatNext: "Et ensuite ?",
    step1: "Notre équipe examinera votre demande rapidement",
    step2: "Un expert flotte vous rappellera dès que possible",
    step3: "Nous préparerons une démo adaptée à la taille de votre flotte",
  },
  ar: {
    preview: "سنعاود الاتصال بك قريباً",
    title: "سنعاود الاتصال بك!",
    thankYou:
      "شكراً لاهتمامك بـ FleetCore! لقد تلقينا طلب معاودة الاتصال وسيتواصل معك فريقنا قريباً.",
    requestDetails: "بياناتك:",
    company: "الشركة",
    fleetSize: "حجم الأسطول",
    phone: "الهاتف",
    whatNext: "ماذا بعد؟",
    step1: "سيراجع فريقنا طلبك قريباً",
    step2: "سيتصل بك خبير أساطيل في أقرب وقت",
    step3: "سنحضر عرضاً توضيحياً مخصصاً لحجم أسطولك",
  },
} as const;

// ============================================================================
// EXPANSION OPPORTUNITY (V6.3 - Marketing-focused waitlist email)
// ============================================================================

export const expansionOpportunityTranslations = {
  en: {
    // Email preview
    preview: "FleetCore: +30% revenue for rideshare fleets",

    // Section 1: Why FleetCore (Marketing pitch) - ROI FIRST
    whyFleetcoreTitle: "The platform built for rideshare fleets",
    whyFleetcoreIntro:
      "FleetCore is the first tool designed specifically for rideshare fleets. Connect your platforms, analyze profitability per driver, reduce dead mileage.",
    benefit1Title: "+30% revenue",
    benefit1Text:
      "Our users optimize their operations and increase their revenue by up to 30% in the first 6 months.",
    benefit2Title: "Profitability per driver",
    benefit2Text:
      "Know exactly which drivers are profitable. Identify who's costing you money and why.",
    benefit3Title: "All platforms in one place",
    benefit3Text:
      "Uber, Bolt, Careem, Heetch... Connect all your apps and get a unified view of your entire fleet.",
    benefit4Title: "10h saved per week",
    benefit4Text:
      "Automate payouts, reconciliation, and reports. No more Excel nightmares or manual calculations.",

    // Section 2: Stay informed (Single CTA) - NO "waiting list"
    stayInformedTitle: "Get notified at launch",
    stayInformedMessage:
      "Tell us about your fleet size so we can prepare the best offer for you when we launch in your country.",
    optInButton: "Notify me at launch",

    // Footer
    visitWebsite: "Discover FleetCore",
  },
  fr: {
    // Email preview
    preview: "FleetCore : +30% de CA pour les flottes VTC",

    // Section 1: Why FleetCore (Marketing pitch) - ROI FIRST
    whyFleetcoreTitle: "La plateforme conçue pour les flottes VTC",
    whyFleetcoreIntro:
      "FleetCore est le premier outil conçu spécifiquement pour les flottes VTC. Connectez vos plateformes, analysez la rentabilité par chauffeur, réduisez vos kilomètres à vide.",
    benefit1Title: "+30% de chiffre d'affaires",
    benefit1Text:
      "Nos utilisateurs optimisent leurs opérations et augmentent leur CA jusqu'à 30% dans les 6 premiers mois.",
    benefit2Title: "Rentabilité par chauffeur",
    benefit2Text:
      "Sachez exactement quels chauffeurs sont rentables. Identifiez qui vous coûte de l'argent et pourquoi.",
    benefit3Title: "Toutes les plateformes au même endroit",
    benefit3Text:
      "Uber, Bolt, Careem, Heetch... Connectez toutes vos apps et obtenez une vue unifiée de toute votre flotte.",
    benefit4Title: "10h économisées par semaine",
    benefit4Text:
      "Automatisez les paiements, la réconciliation et les rapports. Fini les cauchemars Excel et les calculs manuels.",

    // Section 2: Stay informed (Single CTA) - NO "liste d'attente"
    stayInformedTitle: "Soyez informé au lancement",
    stayInformedMessage:
      "Dites-nous la taille de votre flotte pour qu'on puisse préparer la meilleure offre pour vous lors de notre lancement.",
    optInButton: "Me prévenir au lancement",

    // Footer
    visitWebsite: "Découvrir FleetCore",
  },
  ar: {
    // Email preview
    preview: "FleetCore: +30% إيرادات لأساطيل النقل التشاركي",

    // Section 1: Why FleetCore (Marketing pitch) - ROI FIRST
    whyFleetcoreTitle: "المنصة المصممة لأساطيل النقل التشاركي",
    whyFleetcoreIntro:
      "FleetCore هي الأداة الأولى المصممة خصيصاً لأساطيل النقل التشاركي. اربط منصاتك، حلل الربحية لكل سائق، قلل الكيلومترات الفارغة.",
    benefit1Title: "+30% إيرادات",
    benefit1Text:
      "مستخدمونا يحسنون عملياتهم ويزيدون إيراداتهم حتى 30% في أول 6 أشهر.",
    benefit2Title: "الربحية لكل سائق",
    benefit2Text: "اعرف بالضبط أي السائقين مربحون. حدد من يكلفك المال ولماذا.",
    benefit3Title: "جميع المنصات في مكان واحد",
    benefit3Text:
      "Uber، Bolt، Careem، Heetch... اربط جميع تطبيقاتك واحصل على رؤية موحدة لأسطولك بالكامل.",
    benefit4Title: "10 ساعات توفير أسبوعياً",
    benefit4Text:
      "أتمت المدفوعات والتسوية والتقارير. لا مزيد من كوابيس Excel أو الحسابات اليدوية.",

    // Section 2: Stay informed (Single CTA) - NO "waiting list"
    stayInformedTitle: "احصل على إشعار عند الإطلاق",
    stayInformedMessage:
      "أخبرنا عن حجم أسطولك حتى نتمكن من إعداد أفضل عرض لك عند إطلاقنا في بلدك.",
    optInButton: "أبلغني عند الإطلاق",

    // Footer
    visitWebsite: "اكتشف FleetCore",
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
// MEMBER INVITATION
// ============================================================================

export const memberInvitationTranslations = {
  en: {
    preview: "You've been invited to FleetCore",
    invitedTo: "has invited you to join",
    onFleetCore: "on FleetCore.",
    invitedToFleetCore: "You've been invited to join FleetCore.",
    clickButton:
      "Click the button below to accept the invitation and set up your account:",
    acceptButton: "Accept Invitation",
    linkExpiry: "This invitation expires in",
    days: "days",
    didntExpect: "If you didn't expect this email, you can safely ignore it.",
  },
  fr: {
    preview: "Vous avez été invité sur FleetCore",
    invitedTo: "vous a invité à rejoindre",
    onFleetCore: "sur FleetCore.",
    invitedToFleetCore: "Vous avez été invité à rejoindre FleetCore.",
    clickButton:
      "Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :",
    acceptButton: "Accepter l'invitation",
    linkExpiry: "Cette invitation expire dans",
    days: "jours",
    didntExpect:
      "Si vous n'attendiez pas cet email, vous pouvez l'ignorer en toute sécurité.",
  },
  ar: {
    preview: "تمت دعوتك إلى FleetCore",
    invitedTo: "دعاك للانضمام إلى",
    onFleetCore: "على FleetCore.",
    invitedToFleetCore: "تمت دعوتك للانضمام إلى FleetCore.",
    clickButton: "انقر على الزر أدناه لقبول الدعوة وإنشاء حسابك:",
    acceptButton: "قبول الدعوة",
    linkExpiry: "ستنتهي هذه الدعوة خلال",
    days: "يوم",
    didntExpect: "إذا لم تكن تتوقع هذا البريد الإلكتروني، يمكنك تجاهله بأمان.",
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
// DEMO REMINDER J-1 (V6.2.9)
// ============================================================================

export const demoReminderJ1Translations = {
  en: {
    preview: "Tomorrow at {{time}} - Please confirm your FleetCore demo",
    subject: "Tomorrow at {{time}} - Please confirm your FleetCore demo",
    reminder: "Quick reminder about your demo tomorrow!",
    scheduledFor: "Your demo is scheduled for:",
    date: "Date",
    time: "Time",
    phone: "Phone",
    duration: "Duration",
    durationValue: "~20-30 min",
    preparing:
      "We're preparing a personalized demo tailored to your fleet of {{fleetSize}}. Our expert will call you at the scheduled time.",
    confirmQuestion: "Will you be available?",
    confirmButton: "✅ I'll be there",
    rescheduleButton: "📅 Need to reschedule",
    commitment:
      "If you confirm, we commit to calling you at the exact scheduled time.",
    cantMakeIt:
      "Can't make it? No problem! Use the reschedule button above to find a better time.",
  },
  fr: {
    preview: "Demain à {{time}} - Merci de confirmer votre démo FleetCore",
    subject: "Demain à {{time}} - Merci de confirmer votre démo FleetCore",
    reminder: "Petit rappel pour votre démo demain !",
    scheduledFor: "Votre démo est prévue pour :",
    date: "Date",
    time: "Heure",
    phone: "Téléphone",
    duration: "Durée",
    durationValue: "~20-30 min",
    preparing:
      "Nous préparons une démo personnalisée adaptée à votre flotte de {{fleetSize}}. Notre expert vous appellera à l'heure prévue.",
    confirmQuestion: "Serez-vous disponible ?",
    confirmButton: "✅ Je serai là",
    rescheduleButton: "📅 Reprogrammer",
    commitment:
      "Si vous confirmez, nous nous engageons à vous appeler à l'heure exacte prévue.",
    cantMakeIt:
      "Vous ne pouvez pas ? Pas de problème ! Utilisez le bouton ci-dessus pour trouver un meilleur créneau.",
  },
  ar: {
    preview: "غداً في {{time}} - يرجى تأكيد عرض FleetCore التوضيحي",
    subject: "غداً في {{time}} - يرجى تأكيد عرض FleetCore التوضيحي",
    reminder: "تذكير سريع بشأن العرض التوضيحي غداً!",
    scheduledFor: "العرض التوضيحي مجدول في:",
    date: "التاريخ",
    time: "الوقت",
    phone: "الهاتف",
    duration: "المدة",
    durationValue: "~20-30 دقيقة",
    preparing:
      "نحن نجهز عرضاً توضيحياً مخصصاً لأسطولك المكون من {{fleetSize}}. سيتصل بك خبيرنا في الوقت المحدد.",
    confirmQuestion: "هل ستكون متاحاً؟",
    confirmButton: "✅ سأكون هناك",
    rescheduleButton: "📅 إعادة الجدولة",
    commitment: "إذا أكدت، نلتزم بالاتصال بك في الوقت المحدد بالضبط.",
    cantMakeIt:
      "لا يمكنك الحضور؟ لا مشكلة! استخدم زر إعادة الجدولة أعلاه للعثور على وقت أفضل.",
  },
} as const;

// ============================================================================
// BOOKING CONFIRMATION (V6.5 - Replaces Cal.com default email)
// ============================================================================

export const bookingConfirmationTranslations = {
  en: {
    preview: "Your FleetCore demo is confirmed!",
    confirmed: "Demo Confirmed",
    headline: "Your demo is scheduled!",
    message:
      "We're excited to show you how FleetCore can transform your fleet operations. Here are your booking details:",
    bookingDetails: "Booking Details",
    date: "Date",
    time: "Time",
    duration: "Duration",
    durationValue: "20 minutes",
    location: "Location",
    joinMeeting: "Join Meeting",
    whatToExpect: "What to expect during your demo:",
    expect1: "Quick overview of FleetCore's key features",
    expect2: "Live demo tailored to your fleet size",
    expect3: "Q&A session with our fleet expert",
    needToChange: "Need to make a change?",
    modifyBooking: "Modify My Booking",
    seeYouSoon: "We look forward to speaking with you!",
  },
  fr: {
    preview: "Votre démo FleetCore est confirmée !",
    confirmed: "Démo confirmée",
    headline: "Votre démo est planifiée !",
    message:
      "Nous sommes impatients de vous montrer comment FleetCore peut transformer vos opérations de flotte. Voici les détails de votre réservation :",
    bookingDetails: "Détails de la réservation",
    date: "Date",
    time: "Heure",
    duration: "Durée",
    durationValue: "20 minutes",
    location: "Lieu",
    joinMeeting: "Rejoindre la réunion",
    whatToExpect: "Ce qui vous attend pendant la démo :",
    expect1: "Aperçu rapide des fonctionnalités clés de FleetCore",
    expect2: "Démo en direct adaptée à la taille de votre flotte",
    expect3: "Session Q&R avec notre expert flotte",
    needToChange: "Besoin de modifier ?",
    modifyBooking: "Modifier ma réservation",
    seeYouSoon: "Nous avons hâte de vous parler !",
  },
  ar: {
    preview: "تم تأكيد عرض FleetCore التوضيحي!",
    confirmed: "تم تأكيد العرض",
    headline: "تم جدولة العرض التوضيحي!",
    message:
      "نحن متحمسون لنعرض لك كيف يمكن لـ FleetCore تحويل عمليات أسطولك. إليك تفاصيل حجزك:",
    bookingDetails: "تفاصيل الحجز",
    date: "التاريخ",
    time: "الوقت",
    duration: "المدة",
    durationValue: "20 دقيقة",
    location: "الموقع",
    joinMeeting: "الانضمام للاجتماع",
    whatToExpect: "ما الذي تتوقعه خلال العرض:",
    expect1: "نظرة سريعة على ميزات FleetCore الرئيسية",
    expect2: "عرض مباشر مصمم لحجم أسطولك",
    expect3: "جلسة أسئلة وأجوبة مع خبير الأسطول",
    needToChange: "تحتاج إلى تغيير؟",
    modifyBooking: "تعديل حجزي",
    seeYouSoon: "نتطلع للتحدث معك!",
  },
} as const;

// ============================================================================
// NURTURING RECOVERY (T+1h)
// ============================================================================

export const nurturingRecoveryTranslations = {
  en: {
    preview: "Your FleetCore demo awaits",
    subject: "Your FleetCore demo awaits",
    headline: "Ran into a problem?",
    message:
      "We noticed you started setting up your FleetCore demo but didn't finish. No worries — these things happen!",
    techIssue:
      "If you experienced a technical issue or simply ran out of time, you can pick up right where you left off.",
    resumeButton: "Resume my request",
    noAction:
      "If you're no longer interested, no action is needed. This is the only reminder you'll receive.",
    unsubscribe: "Unsubscribe from these emails",
  },
  fr: {
    preview: "Votre démo FleetCore vous attend",
    subject: "Votre démo FleetCore vous attend",
    headline: "Un problème technique ?",
    message:
      "Nous avons remarqué que vous avez commencé à configurer votre démo FleetCore mais n'avez pas terminé. Pas de souci — ça arrive !",
    techIssue:
      "Si vous avez rencontré un problème technique ou manqué de temps, vous pouvez reprendre exactement là où vous vous êtes arrêté.",
    resumeButton: "Reprendre ma demande",
    noAction:
      "Si vous n'êtes plus intéressé, aucune action n'est nécessaire. C'est le seul rappel que vous recevrez.",
    unsubscribe: "Se désabonner de ces emails",
  },
  ar: {
    preview: "عرض FleetCore التوضيحي في انتظارك",
    subject: "عرض FleetCore التوضيحي في انتظارك",
    headline: "هل واجهت مشكلة؟",
    message:
      "لاحظنا أنك بدأت في إعداد عرض FleetCore التوضيحي لكنك لم تكمل العملية. لا تقلق — هذه الأمور تحدث!",
    techIssue:
      "إذا واجهت مشكلة تقنية أو نفد وقتك، يمكنك المتابعة من حيث توقفت.",
    resumeButton: "استئناف طلبي",
    noAction:
      "إذا لم تعد مهتمًا، لا حاجة لأي إجراء. هذا هو التذكير الوحيد الذي ستتلقاه.",
    unsubscribe: "إلغاء الاشتراك من هذه الرسائل",
  },
} as const;

// ============================================================================
// NURTURING J+1
// ============================================================================

export const nurturingJ1Translations = {
  en: {
    preview: "FleetCore: Save €142/vehicle/month",
    subject: "FleetCore: Save €142/vehicle/month",
    headline: "Resume where you left off",
    message:
      "You showed interest in FleetCore — our fleet management platform trusted by operators across the UAE and France.",
    valueProp: "On average, FleetCore customers save:",
    saving1: "€142–228 per vehicle per month",
    saving2: "6.5x return on investment in the first year",
    saving3: "35% reduction in administrative workload",
    ctaText:
      "Book a 20-minute personalized demo to see how these savings apply to your fleet.",
    resumeButton: "Resume my request",
    unsubscribe: "Unsubscribe from these emails",
  },
  fr: {
    preview: "FleetCore : Économisez 142€/véhicule/mois",
    subject: "FleetCore : Économisez 142€/véhicule/mois",
    headline: "Reprenez là où vous vous êtes arrêté",
    message:
      "Vous avez montré de l'intérêt pour FleetCore — notre plateforme de gestion de flotte utilisée par des opérateurs aux Émirats et en France.",
    valueProp: "En moyenne, les clients FleetCore économisent :",
    saving1: "142–228€ par véhicule par mois",
    saving2: "6,5x de retour sur investissement la première année",
    saving3: "35% de réduction de la charge administrative",
    ctaText:
      "Réservez une démo personnalisée de 20 minutes pour découvrir comment ces économies s'appliquent à votre flotte.",
    resumeButton: "Reprendre ma demande",
    unsubscribe: "Se désabonner de ces emails",
  },
  ar: {
    preview: "FleetCore: وفر 142€ لكل مركبة شهرياً",
    subject: "FleetCore: وفر 142€ لكل مركبة شهرياً",
    headline: "تابع من حيث توقفت",
    message:
      "لقد أبديت اهتمامًا بـ FleetCore — منصة إدارة الأساطيل المعتمدة من مشغلين في الإمارات وفرنسا.",
    valueProp: "في المتوسط، يوفر عملاء FleetCore:",
    saving1: "142-228€ لكل مركبة شهرياً",
    saving2: "6.5 أضعاف العائد على الاستثمار في السنة الأولى",
    saving3: "35% تخفيض في عبء العمل الإداري",
    ctaText:
      "احجز عرضًا توضيحيًا مخصصًا لمدة 20 دقيقة لمعرفة كيف تنطبق هذه التوفيرات على أسطولك.",
    resumeButton: "استئناف طلبي",
    unsubscribe: "إلغاء الاشتراك من هذه الرسائل",
  },
} as const;

// ============================================================================
// NURTURING J+7
// ============================================================================

export const nurturingJ7Translations = {
  en: {
    preview: "Last chance: Your FleetCore demo",
    subject: "Last chance: Your FleetCore demo",
    headline: "One last reminder",
    message:
      "A week ago, you started requesting a FleetCore demo. We understand that schedules are busy — this is our final reminder.",
    whatYouGet: "In just 20 minutes, you'll see:",
    benefit1: "Real-time fleet tracking and management",
    benefit2: "Automated maintenance and insurance alerts",
    benefit3: "Financial reporting that saves hours each week",
    ctaText: "After this email, we won't contact you again about this request.",
    resumeButton: "Schedule my demo",
    stayInTouch:
      "Not the right time? No problem. You can always visit fleetcore.io when you're ready.",
    unsubscribe: "Unsubscribe from these emails",
  },
  fr: {
    preview: "Dernière chance : Votre démo FleetCore",
    subject: "Dernière chance : Votre démo FleetCore",
    headline: "Un dernier rappel",
    message:
      "Il y a une semaine, vous avez commencé à demander une démo FleetCore. Nous comprenons que les emplois du temps sont chargés — ceci est notre dernier rappel.",
    whatYouGet: "En seulement 20 minutes, vous découvrirez :",
    benefit1: "Suivi et gestion de flotte en temps réel",
    benefit2: "Alertes automatiques d'entretien et d'assurance",
    benefit3: "Rapports financiers qui font gagner des heures chaque semaine",
    ctaText:
      "Après cet email, nous ne vous recontacterons plus au sujet de cette demande.",
    resumeButton: "Planifier ma démo",
    stayInTouch:
      "Pas le bon moment ? Pas de problème. Vous pouvez toujours visiter fleetcore.io quand vous serez prêt.",
    unsubscribe: "Se désabonner de ces emails",
  },
  ar: {
    preview: "الفرصة الأخيرة: عرض FleetCore التوضيحي",
    subject: "الفرصة الأخيرة: عرض FleetCore التوضيحي",
    headline: "تذكير أخير",
    message:
      "قبل أسبوع، بدأت في طلب عرض FleetCore التوضيحي. نحن نتفهم أن الجداول مزدحمة — هذا هو تذكيرنا الأخير.",
    whatYouGet: "في 20 دقيقة فقط، ستشاهد:",
    benefit1: "تتبع وإدارة الأسطول في الوقت الحقيقي",
    benefit2: "تنبيهات تلقائية للصيانة والتأمين",
    benefit3: "تقارير مالية توفر ساعات كل أسبوع",
    ctaText: "بعد هذا البريد الإلكتروني، لن نتواصل معك مجددًا بشأن هذا الطلب.",
    resumeButton: "جدولة العرض التوضيحي",
    stayInTouch:
      "ليس الوقت المناسب؟ لا مشكلة. يمكنك دائمًا زيارة fleetcore.io عندما تكون جاهزًا.",
    unsubscribe: "إلغاء الاشتراك من هذه الرسائل",
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
