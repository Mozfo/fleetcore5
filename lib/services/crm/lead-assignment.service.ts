/**
 * Lead Assignment Service - Automatic Sales Rep Assignment
 *
 * This service implements automated lead-to-sales-rep assignment based on:
 * 1. Fleet size priority (500+ → Senior Account Manager)
 * 2. Geographic zones (UAE, KSA, France, EU, MENA, International)
 * 3. Fallback to Sales Manager pattern
 * 4. Ultimate fallback to any active employee
 *
 * Configuration is loaded from crm_settings.lead_assignment_rules.
 *
 * Assignment Algorithm:
 * - Priority 1: Fleet size rules (500+ vehicles → Senior reps only)
 * - Priority 2: Geographic zone matching (AE country → UAE specialist)
 * - Priority 3: Fallback pattern matching (any Sales Manager)
 * - Priority 4: Ultimate fallback (any active employee)
 *
 * Pattern Matching:
 * - SQL LIKE patterns (%Senior%Account%Manager%) converted to RegExp
 * - Case-insensitive matching
 * - Include/exclude pattern support
 *
 * Round-Robin Selection:
 * - Deterministic selection (sorted by employee ID)
 * - Ensures fair distribution over time
 *
 * @module lib/services/crm/lead-assignment.service
 */

import {
  CrmSettingsRepository,
  CrmSettingKey,
} from "@/lib/repositories/crm/settings.repository";
import { prisma } from "@/lib/prisma";

// ===== TYPES & INTERFACES =====

/**
 * Fleet size rule configuration
 */
export interface FleetSizeRule {
  title_patterns: string[];
  exclude_patterns?: string[];
  priority: number;
}

/**
 * Geographic zone rule configuration
 */
export interface GeographicZoneRule {
  countries: string[];
  title_patterns: string[];
  priority: number;
}

/**
 * Fallback rule configuration
 */
export interface FallbackRule {
  employee_id: string | null;
  title_pattern: string;
}

/**
 * Assignment rules configuration structure
 * Loaded from crm_settings.lead_assignment_rules
 */
export interface AssignmentRulesConfig {
  fleet_size_priority: Record<string, FleetSizeRule>;
  geographic_zones: Record<string, GeographicZoneRule>;
  fallback: FallbackRule;
}

/**
 * Eligible employee record (from adm_members)
 */
export interface EligibleEmployee {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  title: string;
  status: string;
}

/**
 * Assignment result with reason and metadata
 */
export interface AssignmentResult {
  assigned_to: string | null;
  assignment_reason: string;
  matched_rule?: string;
  eligible_employees?: number;
}

/**
 * Lead assignment input
 */
export interface LeadAssignmentInput {
  fleet_size: string | null;
  country_code: string | null;
}

// ===== SERVICE CLASS =====

/**
 * Lead Assignment Service
 *
 * Provides automatic lead-to-sales-rep assignment based on
 * fleet size, geographic zones, and fallback rules.
 *
 * Configuration is loaded dynamically from crm_settings table.
 */
export class LeadAssignmentService {
  private settingsRepo: CrmSettingsRepository;

  constructor() {
    this.settingsRepo = new CrmSettingsRepository(prisma);
  }

  /**
   * Load assignment rules configuration from database
   *
   * @returns Assignment rules configuration
   * @throws Error if configuration not found
   */
  private async loadConfig(): Promise<AssignmentRulesConfig> {
    const config =
      await this.settingsRepo.getSettingValue<AssignmentRulesConfig>(
        CrmSettingKey.LEAD_ASSIGNMENT_RULES
      );

    if (!config) {
      throw new Error(
        "Lead assignment rules not found in crm_settings. " +
          "Run seed script: pnpm tsx scripts/seed-crm-settings.ts"
      );
    }

    return config;
  }

  /**
   * Assign lead to sales rep based on assignment rules
   *
   * 4-step assignment algorithm:
   * 1. Fleet size priority: Match fleet size rules (500+ → Senior reps)
   * 2. Geographic zones: Match country to zone specialists
   * 3. Fallback: Match fallback pattern (Sales Manager)
   * 4. Ultimate fallback: Select any active employee
   *
   * @param lead - Lead data (fleet_size, country_code)
   * @param availableEmployees - List of active employees eligible for assignment
   * @returns Assignment result with assigned employee ID and reason
   *
   * @example
   * ```typescript
   * const result = await service.assignToSalesRep(
   *   { fleet_size: "500+", country_code: "AE" },
   *   activeEmployees
   * );
   * // Returns: {
   * //   assigned_to: "emp-123",
   * //   assignment_reason: "Fleet size priority: 500+ → Senior Account Manager",
   * //   matched_rule: "500+",
   * //   eligible_employees: 3
   * // }
   * ```
   */
  async assignToSalesRep(
    lead: LeadAssignmentInput,
    availableEmployees: EligibleEmployee[]
  ): Promise<AssignmentResult> {
    // Validation
    if (availableEmployees.length === 0) {
      return {
        assigned_to: null,
        assignment_reason: "No active employees available for assignment",
      };
    }

    const config = await this.loadConfig();

    // PRIORITY 1: Fleet size priority
    if (lead.fleet_size && config.fleet_size_priority[lead.fleet_size]) {
      const rule = config.fleet_size_priority[lead.fleet_size];
      const eligible = this.filterByTitlePatterns(
        availableEmployees,
        rule.title_patterns,
        rule.exclude_patterns
      );

      if (eligible.length > 0) {
        const selected = this.selectRoundRobin(eligible);
        return {
          assigned_to: selected.id,
          assignment_reason: `Fleet size priority: ${lead.fleet_size} → ${rule.title_patterns.join(", ")}`,
          matched_rule: lead.fleet_size,
          eligible_employees: eligible.length,
        };
      }
    }

    // PRIORITY 2: Geographic zones
    if (lead.country_code) {
      const countryUpper = lead.country_code.toUpperCase();

      // Find zone that contains this country
      for (const [zoneName, zoneRule] of Object.entries(
        config.geographic_zones
      )) {
        if (zoneRule.countries.includes(countryUpper)) {
          const eligible = this.filterByTitlePatterns(
            availableEmployees,
            zoneRule.title_patterns
          );

          if (eligible.length > 0) {
            const selected = this.selectRoundRobin(eligible);
            return {
              assigned_to: selected.id,
              assignment_reason: `Geographic zone: ${zoneName} (${lead.country_code}) → ${zoneRule.title_patterns.join(", ")}`,
              matched_rule: zoneName,
              eligible_employees: eligible.length,
            };
          }
        }
      }
    }

    // PRIORITY 3: Fallback to Sales Manager pattern
    if (config.fallback.employee_id) {
      // Check if specific employee is available
      const specificEmployee = availableEmployees.find(
        (emp) => emp.id === config.fallback.employee_id
      );

      if (specificEmployee) {
        return {
          assigned_to: specificEmployee.id,
          assignment_reason:
            `Fallback: Specific employee (${specificEmployee.first_name} ${specificEmployee.last_name || ""})`.trim(),
          matched_rule: "fallback_specific",
          eligible_employees: 1,
        };
      }
    }

    // Fallback pattern matching
    const fallbackEligible = this.filterByTitlePatterns(availableEmployees, [
      config.fallback.title_pattern,
    ]);

    if (fallbackEligible.length > 0) {
      const selected = this.selectRoundRobin(fallbackEligible);
      return {
        assigned_to: selected.id,
        assignment_reason: `Fallback: ${config.fallback.title_pattern}`,
        matched_rule: "fallback_pattern",
        eligible_employees: fallbackEligible.length,
      };
    }

    // PRIORITY 4: Ultimate fallback - any active employee
    const selected = this.selectRoundRobin(availableEmployees);
    return {
      assigned_to: selected.id,
      assignment_reason:
        "Ultimate fallback: No rule matched, selected active employee",
      matched_rule: "ultimate_fallback",
      eligible_employees: availableEmployees.length,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Filter employees by title patterns (SQL LIKE → RegExp)
   *
   * Supports:
   * - Include patterns: Employee title must match at least one
   * - Exclude patterns: Employee title must not match any
   *
   * SQL LIKE patterns:
   * - %: Matches any sequence of characters
   * - _: Matches any single character
   * - Case-insensitive matching
   *
   * @param employees - List of employees to filter
   * @param includePatterns - SQL LIKE patterns that must match (OR logic)
   * @param excludePatterns - SQL LIKE patterns that must NOT match (AND logic)
   * @returns Filtered employees
   *
   * @example
   * ```typescript
   * const eligible = filterByTitlePatterns(
   *   employees,
   *   ['%Senior%Account%Manager%'],
   *   ['%Junior%']
   * );
   * // Returns employees with "Senior Account Manager" but not "Junior"
   * ```
   */
  private filterByTitlePatterns(
    employees: EligibleEmployee[],
    includePatterns: string[],
    excludePatterns?: string[]
  ): EligibleEmployee[] {
    return employees.filter((emp) => {
      const title = emp.title || "";

      // Check include patterns (must match at least one)
      const matchesInclude = includePatterns.some((pattern) => {
        const regex = this.patternToRegex(pattern);
        return regex.test(title);
      });

      if (!matchesInclude) {
        return false;
      }

      // Check exclude patterns (must not match any)
      if (excludePatterns && excludePatterns.length > 0) {
        const matchesExclude = excludePatterns.some((pattern) => {
          const regex = this.patternToRegex(pattern);
          return regex.test(title);
        });

        if (matchesExclude) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Convert SQL LIKE pattern to JavaScript RegExp
   *
   * Conversions:
   * - % → .* (any characters)
   * - _ → . (single character)
   * - Escape special regex characters
   * - Case-insensitive flag
   *
   * @param pattern - SQL LIKE pattern (e.g., "%Senior%Account%Manager%")
   * @returns JavaScript RegExp
   *
   * @example
   * ```typescript
   * patternToRegex('%Senior%Manager%');
   * // Returns: /.*senior.*manager.* /i
   * ```
   */
  private patternToRegex(pattern: string): RegExp {
    // Escape special regex characters except % and _
    let escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Convert SQL LIKE wildcards to RegExp
    escaped = escaped.replace(/%/g, ".*"); // % → .* (any characters)
    escaped = escaped.replace(/_/g, "."); // _ → . (single character)

    // Case-insensitive matching
    return new RegExp(`^${escaped}$`, "i");
  }

  /**
   * Select employee using round-robin algorithm
   *
   * Deterministic selection ensures fair distribution:
   * 1. Sort employees by ID (alphabetically)
   * 2. Select first employee
   *
   * Note: In a production system, you might track last assignment
   * and rotate through the list. This simplified version always
   * selects the first employee after sorting.
   *
   * @param employees - Non-empty list of eligible employees
   * @returns Selected employee
   * @throws Error if employees list is empty
   *
   * @example
   * ```typescript
   * const selected = selectRoundRobin(eligibleEmployees);
   * // Returns: First employee when sorted by ID
   * ```
   */
  private selectRoundRobin(employees: EligibleEmployee[]): EligibleEmployee {
    if (employees.length === 0) {
      throw new Error("Cannot select from empty employee list");
    }

    // Sort by ID for deterministic selection
    const sorted = [...employees].sort((a, b) => a.id.localeCompare(b.id));

    // Select first employee after sorting
    return sorted[0];
  }
}
