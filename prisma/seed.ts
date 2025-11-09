import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Phase 1 seed...");

  // ===================================
  // SYSTEM ENTITIES (Reserved UUIDs)
  // ===================================
  console.log("⚙️  Creating system entities...");

  // System Tenant (for system-level operations)
  const systemTenant = await prisma.adm_tenants.upsert({
    where: { id: "00000000-0000-0000-0000-000000000000" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000000",
      name: "System",
      country_code: "AE",
      default_currency: "EUR",
      timezone: "UTC",
      clerk_organization_id: null,
    },
  });

  // System User (for automated operations audit trail)
  const systemUser = await prisma.adm_members.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      tenant_id: systemTenant.id,
      email: "system@fleetcore.internal",
      clerk_user_id: "system",
      first_name: "System",
      last_name: "Automated",
      phone: "+00000000000",
      role: "system",
      status: "active",
      metadata: {
        description: "System user for automated operations and notifications",
        automated: true,
      },
    },
  });

  console.log(`✅ Created system tenant and user: ${systemUser.email}`);

  // ===================================
  // ADM_TENANTS - Organizations
  // ===================================
  console.log("📦 Creating tenants...");

  const dubaiOrg = await prisma.adm_tenants.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440001" },
    update: {},
    create: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Dubai Fleet Operations",
      country_code: "AE",
      default_currency: "AED",
      vat_rate: 5.0,
      timezone: "Asia/Dubai",
      clerk_organization_id: null,
    },
  });

  const parisOrg = await prisma.adm_tenants.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440002" },
    update: {},
    create: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Paris VTC Services",
      country_code: "FR",
      default_currency: "EUR",
      vat_rate: 20.0,
      timezone: "Europe/Paris",
      clerk_organization_id: null,
    },
  });

  console.log(`✅ Created 2 tenants: ${dubaiOrg.name}, ${parisOrg.name}`);

  // ===================================
  // ADM_MEMBERS - Users
  // ===================================
  console.log("👥 Creating members...");

  const dubaiAdmin = await prisma.adm_members.upsert({
    where: { id: "660e8400-e29b-41d4-a716-446655440001" },
    update: {},
    create: {
      id: "660e8400-e29b-41d4-a716-446655440001",
      tenant_id: dubaiOrg.id,
      clerk_user_id: "user_clerk_dubai_admin_placeholder",
      email: "admin@dubaifleet.ae",
      phone: "+971501234567", // V2: phone is now required (NOT NULL)
      first_name: "Ahmed",
      last_name: "Al Maktoum",
      role: "admin",
      status: "active",
      metadata: {
        department: "operations",
      },
    },
  });

  const parisAdmin = await prisma.adm_members.upsert({
    where: { id: "660e8400-e29b-41d4-a716-446655440002" },
    update: {},
    create: {
      id: "660e8400-e29b-41d4-a716-446655440002",
      tenant_id: parisOrg.id,
      clerk_user_id: "user_clerk_paris_admin_placeholder",
      email: "admin@parisvtc.fr",
      phone: "+33612345678", // V2: phone is now required (NOT NULL)
      first_name: "Marie",
      last_name: "Dubois",
      role: "admin",
      status: "active",
      metadata: {
        department: "operations",
      },
    },
  });

  console.log(
    `✅ Created 2 members: ${dubaiAdmin.first_name} ${dubaiAdmin.last_name}, ${parisAdmin.first_name} ${parisAdmin.last_name}`
  );

  // ===================================
  // CRM_LEADS - FleetCore Internal Leads (NO tenant_id)
  // ===================================
  console.log("📋 Creating CRM leads...");

  const leads = [
    {
      id: "770e8400-e29b-41d4-a716-446655440001",
      first_name: "Hassan",
      last_name: "Abdullah",
      email: "hassan.abdullah@emiratesfleet.ae",
      phone: "+971501234567",
      demo_company_name: "Emirates Fleet Services",
      country_code: "AE",
      fleet_size: "20-50",
      current_software: "Excel",
      message:
        "Interested in fleet management solution for our Dubai operations",
      status: "new",
      utm_source: "website",
      utm_medium: "organic",
      metadata: {
        industry: "transportation",
        employees: 150,
      },
    },
    {
      id: "770e8400-e29b-41d4-a716-446655440002",
      first_name: "Jean-Pierre",
      last_name: "Martin",
      email: "jp.martin@francevtc.fr",
      phone: "+33612345678",
      demo_company_name: "France VTC Premium",
      country_code: "FR",
      fleet_size: "10-20",
      current_software: "Custom Solution",
      message: "Looking for VTC management platform with driver payroll",
      status: "qualified",
      qualification_score: 75,
      qualification_notes: "Strong interest, budget confirmed, decision maker",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "vtc-france-2025",
      metadata: {
        industry: "vtc",
        employees: 50,
      },
    },
    {
      id: "770e8400-e29b-41d4-a716-446655440003",
      first_name: "Fatima",
      last_name: "Al-Rashid",
      email: "fatima@abudhabirides.ae",
      phone: "+971509876543",
      demo_company_name: "Abu Dhabi Luxury Rides",
      country_code: "AE",
      fleet_size: "50-100",
      current_software: "Outdated System",
      message: "Enterprise fleet solution needed for 80 vehicles",
      status: "qualified",
      qualification_score: 90,
      qualification_notes:
        "Ready to sign, enterprise deal, needs multi-tenant support",
      qualified_date: new Date("2025-10-05"),
      utm_source: "referral",
      utm_medium: "partner",
      metadata: {
        industry: "luxury-transport",
        employees: 200,
        urgency: "high",
      },
    },
  ];

  for (const lead of leads) {
    await prisma.crm_leads.upsert({
      where: { id: lead.id },
      update: {},
      create: lead,
    });
  }

  console.log(`✅ Created ${leads.length} CRM leads`);

  // ===================================
  // RID_DRIVERS - Test Drivers for API Tests
  // ===================================
  console.log("🚗 Creating test drivers...");

  const drivers = [
    {
      id: "880e8400-e29b-41d4-a716-446655440001",
      tenant_id: dubaiOrg.id,
      first_name: "Ahmed",
      last_name: "Hassan",
      email: "ahmed.hassan@driver.ae",
      phone: "+971501234567",
      driver_status: "active" as const,
      cooperation_type: "employee",
      license_number: "DL12345678",
      license_expiry_date: new Date("2026-12-31"),
      rating: 4.8,
      metadata: {
        languages: ["ar", "en"],
        vehicle_preference: "sedan",
      },
    },
    {
      id: "880e8400-e29b-41d4-a716-446655440002",
      tenant_id: parisOrg.id,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean.dupont@driver.fr",
      phone: "+33612345678",
      driver_status: "active" as const,
      cooperation_type: "independent",
      license_number: "FR987654321",
      license_expiry_date: new Date("2025-06-30"),
      rating: 4.5,
      metadata: {
        languages: ["fr", "en"],
        vehicle_preference: "van",
      },
    },
    {
      id: "880e8400-e29b-41d4-a716-446655440003",
      tenant_id: dubaiOrg.id,
      first_name: "Mohammed",
      last_name: "Ali",
      email: "mohammed.ali@driver.ae",
      phone: "+971509876543",
      driver_status: "inactive" as const,
      cooperation_type: "employee",
      license_number: "DL87654321",
      license_expiry_date: new Date("2027-03-15"),
      rating: 3.9,
      metadata: {
        languages: ["ar"],
      },
    },
  ];

  for (const driver of drivers) {
    await prisma.rid_drivers.upsert({
      where: { id: driver.id },
      update: {},
      create: driver,
    });
  }

  console.log(`✅ Created ${drivers.length} test drivers`);

  // ===================================
  // DIR_NOTIFICATION_TEMPLATES - Step 0.4 Templates (en/fr/ar)
  // ===================================
  console.log("📧 Creating notification templates...");

  const templates = [
    // 1. CRM: Lead Confirmation
    {
      template_code: "lead_confirmation",
      channel: "email" as const,
      template_name: "Lead Confirmation Email",
      subject_translations: {
        en: "Thank you for your interest in FleetCore",
        fr: "Merci pour votre intérêt pour FleetCore",
        ar: "شكرا لاهتمامك بـ FleetCore",
      },
      body_translations: {
        en: `Hello {{first_name}},

Thank you for requesting a demo of FleetCore! We have received your request and will contact you within 24 hours.

Your request details:
- Company: {{company_name}}
- Fleet size: {{fleet_size}}
- Country: {{country_name}}

Best regards,
The FleetCore Team`,
        fr: `Bonjour {{first_name}},

Merci d'avoir demandé une démo de FleetCore ! Nous avons bien reçu votre demande et vous contacterons dans les 24 heures.

Détails de votre demande :
- Entreprise : {{company_name}}
- Taille de flotte : {{fleet_size}}
- Pays : {{country_name}}

Cordialement,
L'équipe FleetCore`,
        ar: `مرحبا {{first_name}}،

شكرًا لطلب عرض توضيحي لـ FleetCore! لقد تلقينا طلبك وسنتصل بك خلال 24 ساعة.

تفاصيل طلبك:
- الشركة: {{company_name}}
- حجم الأسطول: {{fleet_size}}
- البلد: {{country_name}}

مع أطيب التحيات،
فريق FleetCore`,
      },
      variables: ["first_name", "company_name", "fleet_size", "country_name"],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 2. CRM: Lead Follow-up
    {
      template_code: "lead_followup",
      channel: "email" as const,
      template_name: "Lead Follow-up Email",
      subject_translations: {
        en: "Don't miss your FleetCore demo",
        fr: "Ne manquez pas votre démo FleetCore",
        ar: "لا تفوت العرض التوضيحي FleetCore",
      },
      body_translations: {
        en: `Hello {{first_name}},

We noticed you requested a demo of FleetCore 2 days ago. We'd love to show you how FleetCore can help optimize your fleet operations.

Our fleet management platform helps {{company_name}} to:
- Reduce fuel costs by up to 20%
- Automate driver payouts and reporting
- Track vehicles and drivers in real-time
- Manage multi-platform operations (Uber, Bolt, Careem)

Book your personalized demo: {{demo_link}}

Best regards,
{{sales_rep_name}}
FleetCore Sales Team`,
        fr: `Bonjour {{first_name}},

Nous avons remarqué que vous avez demandé une démo de FleetCore il y a 2 jours. Nous aimerions vous montrer comment FleetCore peut optimiser vos opérations de flotte.

Notre plateforme de gestion de flotte aide {{company_name}} à :
- Réduire les coûts de carburant jusqu'à 20%
- Automatiser les paiements et rapports chauffeurs
- Suivre véhicules et chauffeurs en temps réel
- Gérer opérations multi-plateformes (Uber, Bolt, Careem)

Réservez votre démo personnalisée : {{demo_link}}

Cordialement,
{{sales_rep_name}}
Équipe commerciale FleetCore`,
        ar: `مرحبا {{first_name}}،

لاحظنا أنك طلبت عرضًا توضيحيًا لـ FleetCore قبل يومين. نود أن نوضح لك كيف يمكن لـ FleetCore تحسين عمليات أسطولك.

تساعد منصة إدارة الأسطول {{company_name}} على:
- تقليل تكاليف الوقود بنسبة تصل إلى 20٪
- أتمتة مدفوعات السائقين وإعداد التقارير
- تتبع المركبات والسائقين في الوقت الفعلي
- إدارة العمليات متعددة المنصات (Uber، Bolt، Careem)

احجز عرضك التوضيحي المخصص: {{demo_link}}

مع أطيب التحيات،
{{sales_rep_name}}
فريق مبيعات FleetCore`,
      },
      variables: ["first_name", "company_name", "demo_link", "sales_rep_name"],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 3. ADM: Member Welcome
    {
      template_code: "member_welcome",
      channel: "email" as const,
      template_name: "Member Welcome Email",
      subject_translations: {
        en: "Welcome to {{tenant_name}} on FleetCore!",
        fr: "Bienvenue chez {{tenant_name}} sur FleetCore !",
        ar: "مرحبًا بك في {{tenant_name}} على FleetCore!",
      },
      body_translations: {
        en: `Hello {{first_name}},

Welcome to {{tenant_name}}! Your account has been created and you can now access FleetCore.

Your login details:
- Email: {{email}}
- Role: {{role}}
- Dashboard: {{dashboard_url}}

Next steps:
1. Complete your profile
2. Set up your preferences
3. Explore the dashboard

Need help? Contact your administrator or visit our Help Center.

Best regards,
The FleetCore Team`,
        fr: `Bonjour {{first_name}},

Bienvenue chez {{tenant_name}} ! Votre compte a été créé et vous pouvez maintenant accéder à FleetCore.

Vos identifiants :
- Email : {{email}}
- Rôle : {{role}}
- Tableau de bord : {{dashboard_url}}

Prochaines étapes :
1. Complétez votre profil
2. Configurez vos préférences
3. Explorez le tableau de bord

Besoin d'aide ? Contactez votre administrateur ou visitez notre Centre d'aide.

Cordialement,
L'équipe FleetCore`,
        ar: `مرحبا {{first_name}}،

مرحبًا بك في {{tenant_name}}! تم إنشاء حسابك ويمكنك الآن الوصول إلى FleetCore.

تفاصيل تسجيل الدخول:
- البريد الإلكتروني: {{email}}
- الدور: {{role}}
- لوحة التحكم: {{dashboard_url}}

الخطوات التالية:
1. أكمل ملفك الشخصي
2. قم بإعداد تفضيلاتك
3. استكشف لوحة التحكم

هل تحتاج مساعدة؟ اتصل بالمسؤول أو قم بزيارة مركز المساعدة.

مع أطيب التحيات،
فريق FleetCore`,
      },
      variables: [
        "first_name",
        "tenant_name",
        "email",
        "role",
        "dashboard_url",
      ],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 4. ADM: Password Reset
    {
      template_code: "member_password_reset",
      channel: "email" as const,
      template_name: "Password Reset Email",
      subject_translations: {
        en: "Reset your FleetCore password",
        fr: "Réinitialisez votre mot de passe FleetCore",
        ar: "إعادة تعيين كلمة مرور FleetCore",
      },
      body_translations: {
        en: `Hello {{first_name}},

We received a request to reset your password for your FleetCore account.

Click the link below to reset your password:
{{reset_link}}

This link will expire in {{expiry_hours}} hours.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
The FleetCore Team`,
        fr: `Bonjour {{first_name}},

Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte FleetCore.

Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
{{reset_link}}

Ce lien expirera dans {{expiry_hours}} heures.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email ou contactez le support en cas de doute.

Cordialement,
L'équipe FleetCore`,
        ar: `مرحبا {{first_name}}،

تلقينا طلبًا لإعادة تعيين كلمة المرور لحساب FleetCore الخاص بك.

انقر على الرابط أدناه لإعادة تعيين كلمة المرور:
{{reset_link}}

ستنتهي صلاحية هذا الرابط خلال {{expiry_hours}} ساعة.

إذا لم تطلب إعادة تعيين كلمة المرور هذه، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بالدعم إذا كان لديك مخاوف.

مع أطيب التحيات،
فريق FleetCore`,
      },
      variables: ["first_name", "reset_link", "expiry_hours"],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 5. FLEET: Vehicle Inspection Reminder
    {
      template_code: "vehicle_inspection_reminder",
      channel: "email" as const,
      template_name: "Vehicle Inspection Reminder",
      subject_translations: {
        en: "Vehicle inspection due soon: {{vehicle_plate}}",
        fr: "Contrôle technique bientôt dû : {{vehicle_plate}}",
        ar: "فحص المركبة مستحق قريبًا: {{vehicle_plate}}",
      },
      body_translations: {
        en: `Hello {{fleet_manager_name}},

This is a reminder that vehicle inspection is due soon for:

Vehicle: {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
Due date: {{due_date}}
Days remaining: {{days_remaining}}

Please schedule the inspection to avoid service disruption.

Book inspection: {{booking_link}}

Best regards,
FleetCore Operations`,
        fr: `Bonjour {{fleet_manager_name}},

Ceci est un rappel que le contrôle technique est bientôt dû pour :

Véhicule : {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
Date limite : {{due_date}}
Jours restants : {{days_remaining}}

Veuillez programmer le contrôle pour éviter toute interruption de service.

Réserver le contrôle : {{booking_link}}

Cordialement,
Opérations FleetCore`,
        ar: `مرحبا {{fleet_manager_name}}،

هذا تذكير بأن فحص المركبة مستحق قريبًا لـ:

المركبة: {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
تاريخ الاستحقاق: {{due_date}}
الأيام المتبقية: {{days_remaining}}

يرجى جدولة الفحص لتجنب انقطاع الخدمة.

حجز الفحص: {{booking_link}}

مع أطيب التحيات،
عمليات FleetCore`,
      },
      variables: [
        "fleet_manager_name",
        "vehicle_make",
        "vehicle_model",
        "vehicle_plate",
        "due_date",
        "days_remaining",
        "booking_link",
      ],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 6. FLEET: Insurance Expiry Alert
    {
      template_code: "insurance_expiry_alert",
      channel: "email" as const,
      template_name: "Insurance Expiry Alert",
      subject_translations: {
        en: "⚠️ Insurance expiring soon: {{vehicle_plate}}",
        fr: "⚠️ Assurance expirant bientôt : {{vehicle_plate}}",
        ar: "⚠️ التأمين ينتهي قريبًا: {{vehicle_plate}}",
      },
      body_translations: {
        en: `Hello {{fleet_manager_name}},

⚠️ URGENT: Vehicle insurance is expiring soon!

Vehicle: {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
Expiry date: {{expiry_date}}
Days remaining: {{days_remaining}}
Insurance provider: {{insurance_provider}}
Policy number: {{policy_number}}

ACTION REQUIRED: Renew insurance immediately to maintain compliance and avoid service interruption.

View details: {{insurance_details_url}}

Best regards,
FleetCore Compliance Team`,
        fr: `Bonjour {{fleet_manager_name}},

⚠️ URGENT : L'assurance du véhicule expire bientôt !

Véhicule : {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
Date d'expiration : {{expiry_date}}
Jours restants : {{days_remaining}}
Assureur : {{insurance_provider}}
Numéro de police : {{policy_number}}

ACTION REQUISE : Renouvelez l'assurance immédiatement pour maintenir la conformité et éviter l'interruption de service.

Voir les détails : {{insurance_details_url}}

Cordialement,
Équipe conformité FleetCore`,
        ar: `مرحبا {{fleet_manager_name}}،

⚠️ عاجل: تأمين المركبة ينتهي قريبًا!

المركبة: {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
تاريخ انتهاء الصلاحية: {{expiry_date}}
الأيام المتبقية: {{days_remaining}}
مزود التأمين: {{insurance_provider}}
رقم البوليصة: {{policy_number}}

مطلوب إجراء: جدد التأمين فورًا للحفاظ على الامتثال وتجنب انقطاع الخدمة.

عرض التفاصيل: {{insurance_details_url}}

مع أطيب التحيات،
فريق الامتثال FleetCore`,
      },
      variables: [
        "fleet_manager_name",
        "vehicle_make",
        "vehicle_model",
        "vehicle_plate",
        "expiry_date",
        "days_remaining",
        "insurance_provider",
        "policy_number",
        "insurance_details_url",
      ],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 7. DRIVER: Onboarding
    {
      template_code: "driver_onboarding",
      channel: "email" as const,
      template_name: "Driver Onboarding Email",
      subject_translations: {
        en: "Welcome to {{fleet_name}} - Get started as a driver",
        fr: "Bienvenue chez {{fleet_name}} - Commencez en tant que chauffeur",
        ar: "مرحبًا بك في {{fleet_name}} - ابدأ كسائق",
      },
      body_translations: {
        en: `Hello {{driver_name}},

Welcome to {{fleet_name}}! We're excited to have you join our team.

Your driver account has been created:
- Driver ID: {{driver_id}}
- Start date: {{start_date}}
- Fleet manager: {{fleet_manager_name}}

Next steps:
1. Download the driver app
2. Upload required documents (license, insurance)
3. Complete platform onboarding (Uber, Bolt, Careem)
4. Review payout schedule and rates

Access driver portal: {{driver_portal_url}}

Need help? Contact your fleet manager or support.

Best regards,
{{fleet_name}} Team`,
        fr: `Bonjour {{driver_name}},

Bienvenue chez {{fleet_name}} ! Nous sommes ravis de vous accueillir dans notre équipe.

Votre compte chauffeur a été créé :
- ID chauffeur : {{driver_id}}
- Date de début : {{start_date}}
- Gestionnaire de flotte : {{fleet_manager_name}}

Prochaines étapes :
1. Téléchargez l'application chauffeur
2. Téléversez les documents requis (permis, assurance)
3. Complétez l'intégration plateformes (Uber, Bolt, Careem)
4. Consultez le calendrier et tarifs de paiement

Accédez au portail chauffeur : {{driver_portal_url}}

Besoin d'aide ? Contactez votre gestionnaire ou le support.

Cordialement,
L'équipe {{fleet_name}}`,
        ar: `مرحبا {{driver_name}}،

مرحبًا بك في {{fleet_name}}! نحن سعداء بانضمامك إلى فريقنا.

تم إنشاء حساب السائق الخاص بك:
- معرف السائق: {{driver_id}}
- تاريخ البدء: {{start_date}}
- مدير الأسطول: {{fleet_manager_name}}

الخطوات التالية:
1. قم بتنزيل تطبيق السائق
2. تحميل المستندات المطلوبة (الرخصة والتأمين)
3. أكمل التسجيل في المنصات (Uber، Bolt، Careem)
4. راجع جدول الدفع والأسعار

الوصول إلى بوابة السائق: {{driver_portal_url}}

هل تحتاج مساعدة؟ اتصل بمدير الأسطول أو الدعم.

مع أطيب التحيات،
فريق {{fleet_name}}`,
      },
      variables: [
        "driver_name",
        "fleet_name",
        "driver_id",
        "start_date",
        "fleet_manager_name",
        "driver_portal_url",
      ],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 8. MAINTENANCE: Scheduled Maintenance
    {
      template_code: "maintenance_scheduled",
      channel: "email" as const,
      template_name: "Scheduled Maintenance Notification",
      subject_translations: {
        en: "Maintenance scheduled: {{vehicle_plate}} on {{maintenance_date}}",
        fr: "Maintenance programmée : {{vehicle_plate}} le {{maintenance_date}}",
        ar: "صيانة مجدولة: {{vehicle_plate}} في {{maintenance_date}}",
      },
      body_translations: {
        en: `Hello {{driver_name}},

Maintenance has been scheduled for your vehicle.

Vehicle: {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
Date: {{maintenance_date}}
Time: {{maintenance_time}}
Location: {{maintenance_location}}
Type: {{maintenance_type}}

Estimated duration: {{estimated_duration}}

Please plan accordingly and ensure the vehicle is available.

View details: {{maintenance_details_url}}

Best regards,
FleetCore Maintenance Team`,
        fr: `Bonjour {{driver_name}},

Une maintenance a été programmée pour votre véhicule.

Véhicule : {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
Date : {{maintenance_date}}
Heure : {{maintenance_time}}
Lieu : {{maintenance_location}}
Type : {{maintenance_type}}

Durée estimée : {{estimated_duration}}

Veuillez planifier en conséquence et assurer la disponibilité du véhicule.

Voir les détails : {{maintenance_details_url}}

Cordialement,
Équipe maintenance FleetCore`,
        ar: `مرحبا {{driver_name}}،

تم جدولة صيانة لمركبتك.

المركبة: {{vehicle_make}} {{vehicle_model}} ({{vehicle_plate}})
التاريخ: {{maintenance_date}}
الوقت: {{maintenance_time}}
الموقع: {{maintenance_location}}
النوع: {{maintenance_type}}

المدة المقدرة: {{estimated_duration}}

يرجى التخطيط وفقًا لذلك والتأكد من توفر المركبة.

عرض التفاصيل: {{maintenance_details_url}}

مع أطيب التحيات،
فريق صيانة FleetCore`,
      },
      variables: [
        "driver_name",
        "vehicle_make",
        "vehicle_model",
        "vehicle_plate",
        "maintenance_date",
        "maintenance_time",
        "maintenance_location",
        "maintenance_type",
        "estimated_duration",
        "maintenance_details_url",
      ],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 9. SYSTEM: Critical Alert
    {
      template_code: "critical_alert",
      channel: "email" as const,
      template_name: "Critical System Alert",
      subject_translations: {
        en: "🚨 CRITICAL: {{alert_title}}",
        fr: "🚨 CRITIQUE : {{alert_title}}",
        ar: "🚨 حرج: {{alert_title}}",
      },
      body_translations: {
        en: `🚨 CRITICAL ALERT

{{alert_title}}

Time: {{alert_time}}
Severity: {{severity}}
Affected: {{affected_items}}

Description:
{{alert_description}}

Recommended action:
{{recommended_action}}

View full details: {{alert_url}}

This is an automated critical alert from FleetCore. Please respond immediately.

FleetCore Monitoring Team`,
        fr: `🚨 ALERTE CRITIQUE

{{alert_title}}

Heure : {{alert_time}}
Gravité : {{severity}}
Affecté : {{affected_items}}

Description :
{{alert_description}}

Action recommandée :
{{recommended_action}}

Voir les détails complets : {{alert_url}}

Ceci est une alerte critique automatisée de FleetCore. Veuillez répondre immédiatement.

Équipe surveillance FleetCore`,
        ar: `🚨 تنبيه حرج

{{alert_title}}

الوقت: {{alert_time}}
الخطورة: {{severity}}
المتأثر: {{affected_items}}

الوصف:
{{alert_description}}

الإجراء الموصى به:
{{recommended_action}}

عرض التفاصيل الكاملة: {{alert_url}}

هذا تنبيه حرج تلقائي من FleetCore. يرجى الرد فورًا.

فريق مراقبة FleetCore`,
      },
      variables: [
        "alert_title",
        "alert_time",
        "severity",
        "affected_items",
        "alert_description",
        "recommended_action",
        "alert_url",
      ],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },

    // 10. WEBHOOK: Test Notification
    {
      template_code: "webhook_test",
      channel: "email" as const,
      template_name: "Webhook Test Notification",
      subject_translations: {
        en: "FleetCore Webhook Test",
        fr: "Test webhook FleetCore",
        ar: "اختبار webhook FleetCore",
      },
      body_translations: {
        en: `This is a test notification from FleetCore.

Timestamp: {{timestamp}}
Test ID: {{test_id}}

If you received this email, webhooks are configured correctly.

FleetCore Engineering Team`,
        fr: `Ceci est une notification de test de FleetCore.

Horodatage : {{timestamp}}
ID de test : {{test_id}}

Si vous avez reçu cet email, les webhooks sont correctement configurés.

Équipe ingénierie FleetCore`,
        ar: `هذا إشعار اختبار من FleetCore.

الطابع الزمني: {{timestamp}}
معرف الاختبار: {{test_id}}

إذا تلقيت هذا البريد الإلكتروني، فقد تم تكوين webhooks بشكل صحيح.

فريق هندسة FleetCore`,
      },
      variables: ["timestamp", "test_id"],
      supported_countries: [
        "FR",
        "AE",
        "SA",
        "GB",
        "US",
        "BE",
        "MA",
        "TN",
        "DZ",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },
  ];

  // Upsert all templates
  for (const template of templates) {
    await prisma.dir_notification_templates.upsert({
      where: {
        template_code_channel: {
          template_code: template.template_code,
          channel: template.channel,
        },
      },
      update: {
        ...template,
        updated_at: new Date(),
      },
      create: template,
    });
  }

  console.log(
    `✅ Created ${templates.length} notification templates (en/fr/ar)`
  );

  console.log("\n🎉 Phase 1 + Step 0.4 seed completed successfully!");
  console.log("📊 Summary:");
  console.log("  - 2 tenants (Dubai, Paris)");
  console.log("  - 2 members (1 admin per tenant)");
  console.log(`  - ${leads.length} demo leads`);
  console.log(`  - ${drivers.length} test drivers`);
  console.log(`  - ${templates.length} notification templates (multilingual)`);
  console.log(
    "\n💡 Next: Run migration for Step 1 tables (adm_roles, dir_*, etc.)"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
