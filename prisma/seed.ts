import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Logger pour seed (permis car c'est un script, pas du code app)
const log = {
  info: (msg: string) => process.stdout.write(`${msg}\n`),
  success: (msg: string) => process.stdout.write(`✅ ${msg}\n`),
  error: (msg: string) => process.stderr.write(`❌ ${msg}\n`),
  section: (msg: string) => process.stdout.write(`\n${msg}\n`),
};

// Helper pour générer des UUIDs déterministes pour le seed
function generateUUID(seed: string): string {
  const hash = seed.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  const hex = Math.abs(hash).toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function main() {
  log.info("🌱 Starting FleetCore seed...");

  // Récupérer les organisations existantes
  log.section("📊 Step 1: Fetching organizations...");

  const organizations = await prisma.organization.findMany({
    where: {
      OR: [{ name: { contains: "Dubai" } }, { name: { contains: "Paris" } }],
    },
    take: 2,
  });

  let dubaiOrg = organizations.find(
    (o) => o.country_code === "AE" || o.name.includes("Dubai")
  );
  let parisOrg = organizations.find(
    (o) => o.country_code === "FR" || o.name.includes("Paris")
  );

  // Utiliser les orgs existantes ou en créer
  if (!dubaiOrg) {
    const existingOrgs = await prisma.organization.findMany({
      where: { country_code: "AE" },
      take: 1,
    });
    if (existingOrgs.length > 0) {
      dubaiOrg = existingOrgs[0];
      log.info(`Using existing UAE org: ${dubaiOrg.name}`);
    }
  }

  if (!parisOrg) {
    const existingOrgs = await prisma.organization.findMany({
      where: { country_code: "FR" },
      take: 1,
    });
    if (existingOrgs.length > 0) {
      parisOrg = existingOrgs[0];
      log.info(`Using existing France org: ${parisOrg.name}`);
    }
  }

  if (!dubaiOrg || !parisOrg) {
    log.error("Need at least one UAE and one France organization in database");
    log.error("Please create organizations first");
    throw new Error("Missing required organizations");
  }

  log.success(`Dubai Org: ${dubaiOrg.name} (${dubaiOrg.id})`);
  log.success(`Paris Org: ${parisOrg.name} (${parisOrg.id})`);

  // ===================================
  // ADM - System Parameters
  // ===================================

  log.section("📋 Step 2: Creating system parameters...");

  const uaeParams = [
    {
      key: "vat_rate",
      value: "5",
      data_type: "decimal",
      description: "UAE VAT Rate (%)",
      editable: true,
    },
    {
      key: "uber_commission_rate",
      value: "25",
      data_type: "decimal",
      description: "Uber Commission Rate (%)",
      editable: true,
    },
    {
      key: "careem_commission_rate",
      value: "20",
      data_type: "decimal",
      description: "Careem Commission Rate (%)",
      editable: true,
    },
    {
      key: "bolt_commission_rate",
      value: "15",
      data_type: "decimal",
      description: "Bolt Commission Rate (%)",
      editable: true,
    },
    {
      key: "fuel_price_petrol",
      value: "2.50",
      data_type: "decimal",
      description: "Petrol price per liter (AED)",
      editable: true,
    },
    {
      key: "fuel_price_diesel",
      value: "2.63",
      data_type: "decimal",
      description: "Diesel price per liter (AED)",
      editable: true,
    },
    {
      key: "fuel_price_electric",
      value: "0.29",
      data_type: "decimal",
      description: "Electricity price per kWh (AED)",
      editable: true,
    },
    {
      key: "currency",
      value: "AED",
      data_type: "string",
      description: "Default currency",
      editable: false,
    },
    {
      key: "vehicle_rental_weekly",
      value: "800",
      data_type: "decimal",
      description: "Default weekly vehicle rental (AED)",
      editable: true,
    },
  ];

  const franceParams = [
    {
      key: "vat_rate",
      value: "20",
      data_type: "decimal",
      description: "France VAT Rate (%)",
      editable: true,
    },
    {
      key: "uber_commission_rate",
      value: "25",
      data_type: "decimal",
      description: "Uber Commission Rate (%)",
      editable: true,
    },
    {
      key: "bolt_commission_rate",
      value: "15",
      data_type: "decimal",
      description: "Bolt Commission Rate (%)",
      editable: true,
    },
    {
      key: "heetch_commission_rate",
      value: "18",
      data_type: "decimal",
      description: "Heetch Commission Rate (%)",
      editable: true,
    },
    {
      key: "fuel_price_diesel",
      value: "1.80",
      data_type: "decimal",
      description: "Diesel price per liter (EUR)",
      editable: true,
    },
    {
      key: "fuel_price_electric",
      value: "0.18",
      data_type: "decimal",
      description: "Electricity price per kWh (EUR)",
      editable: true,
    },
    {
      key: "currency",
      value: "EUR",
      data_type: "string",
      description: "Default currency",
      editable: false,
    },
    {
      key: "minimum_wage_hourly",
      value: "11.65",
      data_type: "decimal",
      description: "SMIC hourly rate (EUR)",
      editable: true,
    },
    {
      key: "social_charges_rate",
      value: "45",
      data_type: "decimal",
      description: "Employer social charges (%)",
      editable: true,
    },
  ];

  for (const param of uaeParams) {
    await prisma.adm_system_parameters.upsert({
      where: {
        tenant_id_country_code_parameter_key: {
          tenant_id: dubaiOrg.id,
          country_code: "AE",
          parameter_key: param.key,
        },
      },
      update: {},
      create: {
        tenant_id: dubaiOrg.id,
        country_code: "AE",
        parameter_key: param.key,
        value: param.value,
        data_type: param.data_type,
        description: param.description,
        is_editable: param.editable,
      },
    });
  }

  for (const param of franceParams) {
    await prisma.adm_system_parameters.upsert({
      where: {
        tenant_id_country_code_parameter_key: {
          tenant_id: parisOrg.id,
          country_code: "FR",
          parameter_key: param.key,
        },
      },
      update: {},
      create: {
        tenant_id: parisOrg.id,
        country_code: "FR",
        parameter_key: param.key,
        value: param.value,
        data_type: param.data_type,
        description: param.description,
        is_editable: param.editable,
      },
    });
  }

  log.success(
    `Created ${uaeParams.length} UAE + ${franceParams.length} France parameters`
  );

  // ===================================
  // ADM - Sequences
  // ===================================

  log.section("🔢 Step 3: Creating sequences...");

  const sequences = [
    { name: "driver_code", prefix: "DRV" },
    { name: "vehicle_code", prefix: "VEH" },
    { name: "invoice_number", prefix: "INV" },
    { name: "batch_number", prefix: "BAT" },
    { name: "document_number", prefix: "DOC" },
  ];

  for (const org of [dubaiOrg, parisOrg]) {
    for (const seq of sequences) {
      await prisma.adm_sequences.upsert({
        where: {
          tenant_id_sequence_name: {
            tenant_id: org.id,
            sequence_name: seq.name,
          },
        },
        update: {},
        create: {
          tenant_id: org.id,
          sequence_name: seq.name,
          prefix: seq.prefix,
          current_value: 0,
        },
      });
    }
  }

  log.success(
    `Created ${sequences.length * 2} sequences (2 orgs x ${sequences.length})`
  );

  // ===================================
  // ADM - Platform Configurations
  // ===================================

  log.section("🔌 Step 4: Creating platform configurations...");

  const dubaiPlatforms = [
    {
      name: "Uber",
      active: true,
      key: "test_uber_uae",
      config: { region: "UAE", cities: ["Dubai", "Abu Dhabi"] },
    },
    {
      name: "Careem",
      active: true,
      key: "test_careem_uae",
      config: { region: "UAE", cities: ["Dubai"] },
    },
    {
      name: "Bolt",
      active: true,
      key: "test_bolt_uae",
      config: { region: "UAE" },
    },
  ];

  const parisPlatforms = [
    {
      name: "Uber",
      active: true,
      key: "test_uber_fr",
      config: { region: "France", cities: ["Paris"] },
    },
    {
      name: "Bolt",
      active: true,
      key: "test_bolt_fr",
      config: { region: "France" },
    },
    {
      name: "Heetch",
      active: false,
      key: null,
      config: { region: "France", note: "Not activated" },
    },
  ];

  for (const platform of dubaiPlatforms) {
    await prisma.adm_platform_configurations.upsert({
      where: {
        tenant_id_platform_name: {
          tenant_id: dubaiOrg.id,
          platform_name: platform.name,
        },
      },
      update: {},
      create: {
        tenant_id: dubaiOrg.id,
        platform_name: platform.name,
        is_active: platform.active,
        api_key: platform.key,
        configuration: platform.config,
      },
    });
  }

  for (const platform of parisPlatforms) {
    await prisma.adm_platform_configurations.upsert({
      where: {
        tenant_id_platform_name: {
          tenant_id: parisOrg.id,
          platform_name: platform.name,
        },
      },
      update: {},
      create: {
        tenant_id: parisOrg.id,
        platform_name: platform.name,
        is_active: platform.active,
        api_key: platform.key,
        configuration: platform.config,
      },
    });
  }

  log.success("Created platform configurations");

  // ===================================
  // ADM - Employers (France only)
  // ===================================

  log.section("🏢 Step 5: Creating employers (France only)...");

  await prisma.adm_employers.upsert({
    where: { siret: "12345678901234" },
    update: {},
    create: {
      tenant_id: parisOrg.id,
      company_name: "SARL Transport Paris",
      siret: "12345678901234",
      address: "123 Avenue des Champs-Élysées",
      city: "Paris",
      postal_code: "75008",
      country_code: "FR",
      contact_name: "Jean Dupont",
      contact_email: "jean.dupont@transport-paris.fr",
      contact_phone: "+33142123456",
      is_active: true,
    },
  });

  await prisma.adm_employers.upsert({
    where: { siret: "98765432109876" },
    update: {},
    create: {
      tenant_id: parisOrg.id,
      company_name: "EURL VTC Services",
      siret: "98765432109876",
      address: "45 Rue de Rivoli",
      city: "Paris",
      postal_code: "75004",
      country_code: "FR",
      contact_name: "Marie Martin",
      contact_email: "marie.martin@vtc-services.fr",
      contact_phone: "+33143987654",
      is_active: true,
    },
  });

  log.success("Created 2 French employers");

  log.section("✅ Seed Phase 1 completed successfully!");
  log.info("Next: Run seed again to add vehicles, drivers, and revenue data");
}

main()
  .catch((e) => {
    log.error(`Seed failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
