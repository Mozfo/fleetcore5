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

  // ===================================
  // FLT - Vehicles
  // ===================================

  log.section("🚗 Step 6: Creating vehicles...");

  const dubaiVehicles = [
    {
      code: "VEH-001",
      make: "Toyota",
      model: "Camry",
      year: 2022,
      license: "D-12345",
      vin: "JTD2222222222222",
      fuel: "petrol",
      color: "White",
    },
    {
      code: "VEH-002",
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      license: "D-67890",
      vin: "5YJ3E1EA1KF111111",
      fuel: "electric",
      color: "Black",
    },
    {
      code: "VEH-003",
      make: "Honda",
      model: "Accord",
      year: 2021,
      license: "D-11111",
      vin: "1HGBH41JXMN222222",
      fuel: "petrol",
      color: "Silver",
    },
  ];

  const parisVehicles = [
    {
      code: "VEH-001",
      make: "Peugeot",
      model: "508",
      year: 2022,
      license: "AB-123-CD",
      vin: "VF3LCYHZPHS333333",
      fuel: "diesel",
      color: "Blue",
    },
    {
      code: "VEH-002",
      make: "Renault",
      model: "Zoe",
      year: 2023,
      license: "EF-456-GH",
      vin: "VF1AG000162444444",
      fuel: "electric",
      color: "White",
    },
  ];

  const createdDubaiVehicles = [];
  for (const v of dubaiVehicles) {
    const vehicle = await prisma.flt_vehicles.upsert({
      where: {
        tenant_id_vehicle_code: {
          tenant_id: dubaiOrg.id,
          vehicle_code: v.code,
        },
      },
      update: {},
      create: {
        tenant_id: dubaiOrg.id,
        vehicle_code: v.code,
        make: v.make,
        model: v.model,
        year: v.year,
        license_plate: v.license,
        vin: v.vin,
        vehicle_type: "sedan",
        fuel_type: v.fuel,
        color: v.color,
        ownership_type: "owned",
        current_odometer: Math.floor(Math.random() * 50000) + 10000,
        status: "active",
      },
    });
    createdDubaiVehicles.push(vehicle);
  }

  const createdParisVehicles = [];
  for (const v of parisVehicles) {
    const vehicle = await prisma.flt_vehicles.upsert({
      where: {
        tenant_id_vehicle_code: {
          tenant_id: parisOrg.id,
          vehicle_code: v.code,
        },
      },
      update: {},
      create: {
        tenant_id: parisOrg.id,
        vehicle_code: v.code,
        make: v.make,
        model: v.model,
        year: v.year,
        license_plate: v.license,
        vin: v.vin,
        vehicle_type: "sedan",
        fuel_type: v.fuel,
        color: v.color,
        ownership_type: "owned",
        current_odometer: Math.floor(Math.random() * 50000) + 10000,
        status: "active",
      },
    });
    createdParisVehicles.push(vehicle);
  }

  log.success(
    `Created ${dubaiVehicles.length} Dubai + ${parisVehicles.length} Paris vehicles`
  );

  // ===================================
  // RID - Drivers
  // ===================================

  log.section("👤 Step 7: Creating drivers...");

  const dubaiDrivers = [
    {
      code: "DRV-001",
      firstName: "Ahmed",
      lastName: "Al Mansoori",
      phone: "+971501234567",
      email: "ahmed.mansoori@test.com",
    },
    {
      code: "DRV-002",
      firstName: "Mohammed",
      lastName: "Al Hashimi",
      phone: "+971507654321",
      email: "mohammed.hashimi@test.com",
    },
    {
      code: "DRV-003",
      firstName: "Fatima",
      lastName: "Al Zaabi",
      phone: "+971509876543",
      email: "fatima.zaabi@test.com",
    },
  ];

  const parisDrivers = [
    {
      code: "DRV-001",
      firstName: "Pierre",
      lastName: "Dupont",
      phone: "+33612345678",
      email: "pierre.dupont@test.fr",
    },
    {
      code: "DRV-002",
      firstName: "Marie",
      lastName: "Martin",
      phone: "+33687654321",
      email: "marie.martin@test.fr",
    },
  ];

  const createdDubaiDrivers = [];
  for (const d of dubaiDrivers) {
    const driver = await prisma.rid_drivers.upsert({
      where: {
        tenant_id_driver_code: {
          tenant_id: dubaiOrg.id,
          driver_code: d.code,
        },
      },
      update: {},
      create: {
        tenant_id: dubaiOrg.id,
        driver_code: d.code,
        first_name: d.firstName,
        last_name: d.lastName,
        email: d.email,
        phone: d.phone,
        employment_type: "contractor",
        employment_status: "active",
        country_code: "AE",
        hire_date: new Date("2024-01-01"),
      },
    });
    createdDubaiDrivers.push(driver);
  }

  const employers = await prisma.adm_employers.findMany({
    where: { tenant_id: parisOrg.id },
  });

  const createdParisDrivers = [];
  for (let i = 0; i < parisDrivers.length; i++) {
    const d = parisDrivers[i];
    const driver = await prisma.rid_drivers.upsert({
      where: {
        tenant_id_driver_code: {
          tenant_id: parisOrg.id,
          driver_code: d.code,
        },
      },
      update: {},
      create: {
        tenant_id: parisOrg.id,
        driver_code: d.code,
        first_name: d.firstName,
        last_name: d.lastName,
        email: d.email,
        phone: d.phone,
        employment_type: "employee",
        employment_status: "active",
        country_code: "FR",
        hire_date: new Date("2024-01-01"),
        employer_id: employers[i % employers.length]?.id,
      },
    });
    createdParisDrivers.push(driver);
  }

  log.success(
    `Created ${dubaiDrivers.length} Dubai + ${parisDrivers.length} Paris drivers`
  );

  // ===================================
  // RID - Driver Platforms
  // ===================================

  log.section("🔗 Step 8: Creating driver platform links...");

  let platformLinkCount = 0;

  for (const driver of createdDubaiDrivers) {
    await prisma.rid_driver_platforms.upsert({
      where: {
        tenant_id_platform_name_platform_driver_id: {
          tenant_id: dubaiOrg.id,
          platform_name: "Uber",
          platform_driver_id: `uber_${driver.driver_code}`,
        },
      },
      update: {},
      create: {
        tenant_id: dubaiOrg.id,
        driver_id: driver.id,
        platform_name: "Uber",
        platform_driver_id: `uber_${driver.driver_code}`,
        is_active: true,
        activation_date: new Date("2024-01-01"),
      },
    });
    platformLinkCount++;

    await prisma.rid_driver_platforms.upsert({
      where: {
        tenant_id_platform_name_platform_driver_id: {
          tenant_id: dubaiOrg.id,
          platform_name: "Careem",
          platform_driver_id: `careem_${driver.driver_code}`,
        },
      },
      update: {},
      create: {
        tenant_id: dubaiOrg.id,
        driver_id: driver.id,
        platform_name: "Careem",
        platform_driver_id: `careem_${driver.driver_code}`,
        is_active: true,
        activation_date: new Date("2024-02-01"),
      },
    });
    platformLinkCount++;
  }

  for (const driver of createdParisDrivers) {
    await prisma.rid_driver_platforms.upsert({
      where: {
        tenant_id_platform_name_platform_driver_id: {
          tenant_id: parisOrg.id,
          platform_name: "Uber",
          platform_driver_id: `uber_${driver.driver_code}`,
        },
      },
      update: {},
      create: {
        tenant_id: parisOrg.id,
        driver_id: driver.id,
        platform_name: "Uber",
        platform_driver_id: `uber_${driver.driver_code}`,
        is_active: true,
        activation_date: new Date("2024-01-01"),
      },
    });
    platformLinkCount++;

    await prisma.rid_driver_platforms.upsert({
      where: {
        tenant_id_platform_name_platform_driver_id: {
          tenant_id: parisOrg.id,
          platform_name: "Bolt",
          platform_driver_id: `bolt_${driver.driver_code}`,
        },
      },
      update: {},
      create: {
        tenant_id: parisOrg.id,
        driver_id: driver.id,
        platform_name: "Bolt",
        platform_driver_id: `bolt_${driver.driver_code}`,
        is_active: true,
        activation_date: new Date("2024-02-01"),
      },
    });
    platformLinkCount++;
  }

  log.success(`Created ${platformLinkCount} driver-platform links`);

  // ===================================
  // RID - Driver Documents
  // ===================================

  log.section("📄 Step 9: Creating driver documents...");

  let documentCount = 0;

  for (const driver of [...createdDubaiDrivers, ...createdParisDrivers]) {
    const tenantId = driver.country_code === "AE" ? dubaiOrg.id : parisOrg.id;

    await prisma.rid_driver_documents.create({
      data: {
        tenant_id: tenantId,
        driver_id: driver.id,
        document_type: "driver_license",
        document_number: `DL${Math.floor(Math.random() * 1000000)}`,
        issue_date: new Date("2020-01-01"),
        expiry_date: new Date("2030-01-01"),
        issuing_country: driver.country_code,
        is_verified: true,
        verified_at: new Date(),
        status: "active",
      },
    });
    documentCount++;

    if (driver.country_code === "FR") {
      await prisma.rid_driver_documents.create({
        data: {
          tenant_id: tenantId,
          driver_id: driver.id,
          document_type: "vtc_card",
          document_number: `VTC${Math.floor(Math.random() * 1000000)}`,
          issue_date: new Date("2023-01-01"),
          expiry_date: new Date("2028-01-01"),
          issuing_country: "FR",
          is_verified: true,
          verified_at: new Date(),
          status: "active",
        },
      });
      documentCount++;
    }
  }

  log.success(`Created ${documentCount} driver documents`);

  // ===================================
  // FLT - Vehicle Assignments
  // ===================================

  log.section("🔄 Step 10: Creating vehicle assignments...");

  let assignmentCount = 0;

  for (let i = 0; i < createdDubaiVehicles.length; i++) {
    if (i < createdDubaiDrivers.length) {
      await prisma.flt_vehicle_assignments.create({
        data: {
          tenant_id: dubaiOrg.id,
          vehicle_id: createdDubaiVehicles[i].id,
          driver_id: createdDubaiDrivers[i].id,
          start_date: new Date("2024-01-01"),
          assignment_type: "long_term",
          status: "active",
        },
      });
      assignmentCount++;
    }
  }

  for (let i = 0; i < createdParisVehicles.length; i++) {
    if (i < createdParisDrivers.length) {
      await prisma.flt_vehicle_assignments.create({
        data: {
          tenant_id: parisOrg.id,
          vehicle_id: createdParisVehicles[i].id,
          driver_id: createdParisDrivers[i].id,
          start_date: new Date("2024-01-01"),
          assignment_type: "long_term",
          status: "active",
        },
      });
      assignmentCount++;
    }
  }

  log.success(`Created ${assignmentCount} vehicle assignments`);

  // ===================================
  // FLT - Vehicle Maintenance
  // ===================================

  log.section("🔧 Step 11: Creating vehicle maintenance records...");

  let maintenanceCount = 0;

  for (const vehicle of [...createdDubaiVehicles, ...createdParisVehicles]) {
    const tenantId = vehicle.country_code === "AE" ? dubaiOrg.id : parisOrg.id;

    await prisma.flt_vehicle_maintenance.create({
      data: {
        tenant_id: tenantId,
        vehicle_id: vehicle.id,
        maintenance_type: "preventive",
        service_class: "A",
        trigger_type: "mileage",
        trigger_value: "10000",
        scheduled_date: new Date("2024-06-01"),
        completed_date: new Date("2024-06-03"),
        odometer_reading: 10000,
        work_performed: "Oil change, filter replacement, tire rotation",
        labor_cost: 150,
        parts_cost: 200,
        total_cost: 350,
        service_provider: "Official Service Center",
        status: "completed",
        next_service_date: new Date("2024-12-01"),
        next_service_mileage: 20000,
      },
    });
    maintenanceCount++;
  }

  log.success(`Created ${maintenanceCount} maintenance records`);

  // ===================================
  // FLT - Vehicle Inspections
  // ===================================

  log.section("🔍 Step 12: Creating vehicle inspections...");

  let inspectionCount = 0;

  for (const vehicle of [...createdDubaiVehicles, ...createdParisVehicles]) {
    const tenantId = vehicle.country_code === "AE" ? dubaiOrg.id : parisOrg.id;

    await prisma.flt_vehicle_inspections.create({
      data: {
        tenant_id: tenantId,
        vehicle_id: vehicle.id,
        inspection_type: "DVIR",
        inspection_date: new Date("2024-09-01"),
        inspection_time: new Date("2024-09-01T08:00:00Z"),
        odometer_reading: vehicle.current_odometer,
        inspection_items: {
          brakes: "pass",
          tires: "pass",
          lights: "pass",
          fluids: "pass",
          exterior: "pass",
        },
        overall_status: "pass",
        defects_found: false,
        critical_defects: false,
        corrective_action_required: false,
      },
    });
    inspectionCount++;
  }

  log.success(`Created ${inspectionCount} vehicle inspections`);

  // ===================================
  // REV - Revenue Imports & Driver Revenues
  // ===================================

  log.section("💰 Step 13: Creating revenue data...");

  const weekStart = new Date("2024-09-23");
  const weekEnd = new Date("2024-09-29");

  let revenueImportCount = 0;
  let driverRevenueCount = 0;

  const members = await prisma.member.findMany({ take: 1 });
  const systemUserId = members[0]?.id || dubaiOrg.id;

  for (const driver of createdDubaiDrivers) {
    const revenueImport = await prisma.rev_revenue_imports.create({
      data: {
        tenant_id: dubaiOrg.id,
        platform_name: "Uber",
        import_date: new Date(),
        period_start: weekStart,
        period_end: weekEnd,
        file_name: `uber_${driver.driver_code}_w39.csv`,
        total_records: 50,
        imported_records: 50,
        failed_records: 0,
        status: "completed",
        imported_by: systemUserId,
      },
    });
    revenueImportCount++;

    for (let day = 0; day < 7; day++) {
      const tripDate = new Date(weekStart);
      tripDate.setDate(tripDate.getDate() + day);

      const trips = Math.floor(Math.random() * 10) + 5;
      for (let trip = 0; trip < trips; trip++) {
        const fareAmount = Math.floor(Math.random() * 50) + 20;
        const commissionAmount = fareAmount * 0.25;
        const driverEarnings = fareAmount - commissionAmount;

        await prisma.rev_driver_revenues.create({
          data: {
            tenant_id: dubaiOrg.id,
            import_id: revenueImport.id,
            driver_id: driver.id,
            platform_name: "Uber",
            trip_date: new Date(tripDate),
            trip_id: `trip_${Math.random().toString(36).substr(2, 9)}`,
            fare_amount: fareAmount,
            commission_amount: commissionAmount,
            commission_rate: 25,
            driver_earnings: driverEarnings,
            currency: "AED",
            distance_km: Math.floor(Math.random() * 30) + 5,
            duration_minutes: Math.floor(Math.random() * 60) + 10,
          },
        });
        driverRevenueCount++;
      }
    }
  }

  for (const driver of createdParisDrivers) {
    const revenueImport = await prisma.rev_revenue_imports.create({
      data: {
        tenant_id: parisOrg.id,
        platform_name: "Uber",
        import_date: new Date(),
        period_start: weekStart,
        period_end: weekEnd,
        file_name: `uber_${driver.driver_code}_w39.csv`,
        total_records: 40,
        imported_records: 40,
        failed_records: 0,
        status: "completed",
        imported_by: systemUserId,
      },
    });
    revenueImportCount++;

    for (let day = 0; day < 7; day++) {
      const tripDate = new Date(weekStart);
      tripDate.setDate(tripDate.getDate() + day);

      const trips = Math.floor(Math.random() * 8) + 4;
      for (let trip = 0; trip < trips; trip++) {
        const fareAmount = Math.floor(Math.random() * 40) + 15;
        const commissionAmount = fareAmount * 0.25;
        const driverEarnings = fareAmount - commissionAmount;

        await prisma.rev_driver_revenues.create({
          data: {
            tenant_id: parisOrg.id,
            import_id: revenueImport.id,
            driver_id: driver.id,
            platform_name: "Uber",
            trip_date: new Date(tripDate),
            trip_id: `trip_${Math.random().toString(36).substr(2, 9)}`,
            fare_amount: fareAmount,
            commission_amount: commissionAmount,
            commission_rate: 25,
            driver_earnings: driverEarnings,
            currency: "EUR",
            distance_km: Math.floor(Math.random() * 25) + 5,
            duration_minutes: Math.floor(Math.random() * 50) + 10,
          },
        });
        driverRevenueCount++;
      }
    }
  }

  log.success(
    `Created ${revenueImportCount} revenue imports with ${driverRevenueCount} driver revenues`
  );

  // ===================================
  // BIL - Driver Balances
  // ===================================

  log.section("📊 Step 14: Creating driver balances...");

  let balanceCount = 0;

  for (const driver of [...createdDubaiDrivers, ...createdParisDrivers]) {
    const tenantId = driver.country_code === "AE" ? dubaiOrg.id : parisOrg.id;

    const revenues = await prisma.rev_driver_revenues.findMany({
      where: { driver_id: driver.id },
    });

    const grossRevenue = revenues.reduce(
      (sum, r) => sum + Number(r.fare_amount),
      0
    );
    const platformFees = revenues.reduce(
      (sum, r) => sum + Number(r.commission_amount || 0),
      0
    );
    const netRevenue = revenues.reduce(
      (sum, r) => sum + Number(r.driver_earnings),
      0
    );

    await prisma.bil_driver_balances.create({
      data: {
        tenant_id: tenantId,
        driver_id: driver.id,
        period_start: weekStart,
        period_end: weekEnd,
        gross_revenue: grossRevenue,
        platform_fees: platformFees,
        net_revenue: netRevenue,
        vehicle_rental: 800,
        total_deductions: 800,
        balance: netRevenue - 800,
        status: "calculated",
      },
    });
    balanceCount++;
  }

  log.success(`Created ${balanceCount} driver balances`);

  // ===================================
  // BIL - Driver Deductions
  // ===================================

  log.section("💸 Step 15: Creating driver deductions...");

  let deductionCount = 0;

  for (const driver of [...createdDubaiDrivers, ...createdParisDrivers]) {
    const tenantId = driver.country_code === "AE" ? dubaiOrg.id : parisOrg.id;
    const currency = driver.country_code === "AE" ? "AED" : "EUR";

    const balance = await prisma.bil_driver_balances.findFirst({
      where: {
        driver_id: driver.id,
        period_start: weekStart,
      },
    });

    if (balance) {
      await prisma.bil_driver_deductions.create({
        data: {
          tenant_id: tenantId,
          driver_id: driver.id,
          deduction_date: weekStart,
          deduction_type: "vehicle_rental",
          amount: 800,
          currency: currency,
          description: "Weekly vehicle rental",
          applied_to_balance: true,
          balance_id: balance.id,
          created_by: systemUserId,
        },
      });
      deductionCount++;
    }
  }

  log.success(`Created ${deductionCount} driver deductions`);

  log.section("✅ Seed completed successfully!");
  log.info(
    `📊 Summary: ${dubaiVehicles.length + parisVehicles.length} vehicles, ${dubaiDrivers.length + parisDrivers.length} drivers, ${driverRevenueCount} revenues, ${balanceCount} balances`
  );
}

main()
  .catch((e) => {
    log.error(`Seed failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
