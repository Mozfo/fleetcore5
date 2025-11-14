import { prisma } from "@/lib/prisma";

/**
 * Enrich existing crm_settings records with UX metadata
 * Run once: pnpm tsx scripts/enrich-crm-settings.ts
 */
async function enrichSettings() {
  try {
    // 1. Enrichir lead_scoring_config
    await prisma.crm_settings.update({
      where: { setting_key: "lead_scoring_config" },
      data: {
        display_label: "Lead Scoring Algorithm",
        display_order: 1,
        ui_component: "nested_form",
        help_text: `Configure how leads are automatically scored based on fit and engagement.

**Fit Score Components:**
- Fleet size (1-10 vehicles → 500+ vehicles)
- Country tier (UAE/KSA Tier 1 → Other countries Tier 5)

**Engagement Score Components:**
- Message length (detailed 200+ chars gets 30 points)
- Phone provided (20 points if present)
- Page views (10+ pages = very engaged, 30 points)
- Time on site (600+ seconds = deep read, 20 points)

**Qualification Thresholds:**
- Sales Qualified Lead (SQL): 70+ points
- Marketing Qualified Lead (MQL): 40-69 points
- Top of Funnel (TOF): 0-39 points

**Impact of Changes:**
- Takes effect immediately for new leads
- Existing leads keep their scores unless manually rescored
- Test in staging environment before production changes`,
        documentation_url: "https://docs.fleetcore.com/crm/lead-scoring",
        default_value: {
          fleet_size_points: {
            "500+": { vehicles: 600, points: 40 },
            "101-500": { vehicles: 250, points: 35 },
            "51-100": { vehicles: 75, points: 30 },
            "11-50": { vehicles: 30, points: 20 },
            "1-10": { vehicles: 5, points: 5 },
            unknown: { vehicles: 30, points: 10 },
          },
          country_tier_points: {
            tier1: { countries: ["AE", "SA", "QA"], points: 20 },
            tier2: { countries: ["FR"], points: 18 },
            tier3: { countries: ["KW", "BH", "OM"], points: 15 },
            tier4: {
              countries: [
                "DE",
                "IT",
                "ES",
                "BE",
                "NL",
                "PT",
                "AT",
                "IE",
                "DK",
                "SE",
                "FI",
                "GR",
                "PL",
                "CZ",
                "HU",
                "RO",
                "BG",
                "HR",
                "SI",
                "SK",
                "LT",
                "LV",
                "EE",
                "CY",
                "LU",
                "MT",
              ],
              points: 12,
            },
            tier5: { points: 5 },
          },
          message_length_thresholds: {
            detailed: { min: 200, points: 30 },
            substantial: { min: 100, points: 20 },
            minimal: { min: 20, points: 10 },
            none: { points: 0 },
          },
          phone_points: { provided: 20, missing: 0 },
          page_views_thresholds: {
            very_engaged: { min: 10, points: 30 },
            interested: { min: 5, points: 20 },
            curious: { min: 2, points: 10 },
            normal: { points: 5 },
          },
          time_on_site_thresholds: {
            deep_read: { min: 600, points: 20 },
            moderate: { min: 300, points: 15 },
            brief: { min: 120, points: 10 },
            quick: { points: 5 },
          },
          qualification_stage_thresholds: {
            sales_qualified: 70,
            marketing_qualified: 40,
            top_of_funnel: 0,
          },
          qualification_weights: {
            fit: 0.6,
            engagement: 0.4,
          },
        },
      },
    });

    // 2. Enrichir lead_assignment_rules
    await prisma.crm_settings.update({
      where: { setting_key: "lead_assignment_rules" },
      data: {
        display_label: "Lead Assignment Rules",
        display_order: 2,
        ui_component: "nested_form",
        help_text: `Configure automatic lead assignment to sales representatives.

**Assignment Priority:**
1. Fleet size priority (500+ → Senior Account Manager)
2. Geographic zones (UAE, KSA, France, EU, MENA, International)
3. Round-robin within eligible reps
4. Fallback to default sales manager

**Fleet Size Rules:**
- 500+ vehicles → Senior Account Managers only
- 101-500 vehicles → Account Managers (exclude Senior)
- <100 vehicles → Any available sales rep

**Geographic Zones:**
- UAE (priority 10): title contains "UAE" or "Emirates"
- KSA (priority 11): title contains "KSA" or "Saudi"
- France (priority 12): title contains "France"
- MENA (priority 13): KW, BH, OM, QA, JO, LB, EG, MA, TN, DZ
- EU (priority 14): 26 European countries
- International (priority 15): All other countries

**Impact of Changes:**
- Takes effect immediately for new leads
- Existing assigned leads are NOT reassigned automatically
- Lower priority numbers = higher priority assignment`,
        documentation_url: "https://docs.fleetcore.com/crm/lead-assignment",
        default_value: {
          fleet_size_priority: {
            "500+": {
              title_patterns: ["%Senior%Account%Manager%"],
              priority: 1,
            },
            "101-500": {
              title_patterns: ["%Account%Manager%"],
              exclude_patterns: ["%Senior%"],
              priority: 2,
            },
          },
          geographic_zones: {
            UAE: {
              countries: ["AE"],
              title_patterns: ["%UAE%", "%Emirates%"],
              priority: 10,
            },
            KSA: {
              countries: ["SA"],
              title_patterns: ["%KSA%", "%Saudi%"],
              priority: 11,
            },
            FRANCE: {
              countries: ["FR"],
              title_patterns: ["%France%"],
              priority: 12,
            },
            MENA: {
              countries: [
                "KW",
                "BH",
                "OM",
                "QA",
                "JO",
                "LB",
                "EG",
                "MA",
                "TN",
                "DZ",
              ],
              title_patterns: ["%MENA%", "%Middle East%"],
              priority: 13,
            },
            EU: {
              countries: [
                "DE",
                "IT",
                "ES",
                "BE",
                "NL",
                "PT",
                "AT",
                "IE",
                "DK",
                "SE",
                "FI",
                "GR",
                "PL",
                "CZ",
                "HU",
                "RO",
                "BG",
                "HR",
                "SI",
                "SK",
                "LT",
                "LV",
                "EE",
                "CY",
                "LU",
                "MT",
              ],
              title_patterns: ["%EU%", "%Europe%"],
              priority: 14,
            },
            INTERNATIONAL: {
              countries: [],
              title_patterns: ["%International%"],
              priority: 15,
            },
          },
          fallback: {
            employee_id: null,
            title_pattern: "%Sales%Manager%",
          },
        },
      },
    });

    // Vérifier enrichissement
    const settings = await prisma.crm_settings.findMany({
      select: {
        setting_key: true,
        display_label: true,
        display_order: true,
        ui_component: true,
        help_text: true,
        documentation_url: true,
      },
      orderBy: { display_order: "asc" },
    });

    return { count: settings.length, settings };
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enrichSettings()
  .then(({ count: _count, settings: _settings }) => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
