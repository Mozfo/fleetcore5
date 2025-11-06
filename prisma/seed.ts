import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Phase 1 seed...");

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
      full_name: "Hassan Abdullah",
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
      full_name: "Jean-Pierre Martin",
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
      full_name: "Fatima Al-Rashid",
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

  console.log("\n🎉 Phase 1 seed completed successfully!");
  console.log("📊 Summary:");
  console.log("  - 2 tenants (Dubai, Paris)");
  console.log("  - 2 members (1 admin per tenant)");
  console.log(`  - ${leads.length} demo leads`);
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
