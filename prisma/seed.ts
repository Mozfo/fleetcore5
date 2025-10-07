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
      subdomain: "dubai-fleet",
      country_code: "AE",
      currency: "AED",
      vat_rate: 5.0,
      timezone: "Asia/Dubai",
      status: "active",
      clerk_organization_id: null,
      metadata: {
        city: "Dubai",
        fleet_size: 50,
      },
    },
  });

  const parisOrg = await prisma.adm_tenants.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440002" },
    update: {},
    create: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Paris VTC Services",
      subdomain: "paris-vtc",
      country_code: "FR",
      currency: "EUR",
      vat_rate: 20.0,
      timezone: "Europe/Paris",
      status: "active",
      clerk_organization_id: null,
      metadata: {
        city: "Paris",
        fleet_size: 30,
      },
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
      first_name: "Ahmed",
      last_name: "Al Maktoum",
      status: "active",
      metadata: {
        role: "admin",
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
      first_name: "Marie",
      last_name: "Dubois",
      status: "active",
      metadata: {
        role: "admin",
        department: "operations",
      },
    },
  });

  console.log(
    `✅ Created 2 members: ${dubaiAdmin.first_name} ${dubaiAdmin.last_name}, ${parisAdmin.first_name} ${parisAdmin.last_name}`
  );

  // ===================================
  // CRM_LEADS - Demo Requests
  // ===================================
  console.log("📋 Creating demo leads...");

  const leads = [
    {
      id: "770e8400-e29b-41d4-a716-446655440001",
      full_name: "Hassan Abdullah",
      email: "hassan.abdullah@emiratesfleet.ae",
      phone: "+971501234567",
      demo_company_name: "Emirates Fleet Services",
      fleet_size: "20-50",
      country_code: "AE",
      status: "pending",
      message:
        "Interested in fleet management solution for our Dubai operations",
    },
    {
      id: "770e8400-e29b-41d4-a716-446655440002",
      full_name: "Jean-Pierre Martin",
      email: "jp.martin@francevtc.fr",
      phone: "+33612345678",
      demo_company_name: "France VTC Premium",
      fleet_size: "10-20",
      country_code: "FR",
      status: "contacted",
      message: "Looking for VTC management platform with driver payroll",
    },
    {
      id: "770e8400-e29b-41d4-a716-446655440003",
      full_name: "Fatima Al-Rashid",
      email: "fatima@abudhabirides.ae",
      phone: "+971509876543",
      demo_company_name: "Abu Dhabi Luxury Rides",
      fleet_size: "50-100",
      country_code: "AE",
      status: "qualified",
      message: "Enterprise fleet solution needed for 80 vehicles",
      qualified_date: new Date("2025-10-05"),
    },
  ];

  for (const lead of leads) {
    await prisma.crm_leads.upsert({
      where: { id: lead.id },
      update: {},
      create: lead,
    });
  }

  console.log(`✅ Created ${leads.length} demo leads`);

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
