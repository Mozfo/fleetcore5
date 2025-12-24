/**
 * ILeadRepository Interface - Découplage Prisma
 *
 * Cette interface permet de :
 * 1. Remplacer l'ORM (Prisma → Drizzle, TypeORM, etc.) sans casser le code
 * 2. Mocker proprement pour les tests unitaires
 * 3. Respecter le principe SOLID (Dependency Inversion)
 *
 * PRINCIPE: Le Service dépend de l'abstraction (interface), pas du concret (Prisma)
 *
 * @module lib/repositories/crm/lead.repository.interface
 */

import type { crm_leads } from "@prisma/client";
import type {
  LeadWithCountry,
  OpportunitySummary,
  QuoteSummary,
  TimelineEntry,
} from "@/lib/types/crm/lead.types";

/**
 * Lead base type (from Prisma, re-exported for convenience)
 */
export type Lead = crm_leads;

/**
 * ILeadRepository - Contract for Lead Data Access
 *
 * Any implementation (Prisma, Drizzle, Mock) must respect this contract.
 *
 * @example
 * ```typescript
 * // Production: PrismaLeadRepository
 * const service = new LeadService(new LeadRepository(prisma));
 *
 * // Tests: MockLeadRepository
 * const service = new LeadService(new MockLeadRepository());
 * ```
 */
export interface ILeadRepository {
  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Find a Lead by ID
   *
   * @param id - Lead UUID
   * @returns Lead or null if not found
   */
  findById(id: string): Promise<Lead | null>;

  /**
   * Find Lead with Country and Locale data
   *
   * CRITICAL for currency derivation:
   * Lead.country_code → crm_countries → dir_country_locales → currency
   *
   * @param id - Lead UUID
   * @returns Lead with country/locale or null
   */
  findWithCountry(id: string): Promise<LeadWithCountry | null>;

  // ============================================
  // LEAD 360 VIEW METHODS
  // ============================================

  /**
   * Find all Opportunities for a Lead
   *
   * @param leadId - Lead UUID
   * @returns Array of opportunity summaries
   */
  findOpportunities(leadId: string): Promise<OpportunitySummary[]>;

  /**
   * Find all Quotes for a Lead (via Opportunities)
   *
   * @param leadId - Lead UUID
   * @returns Array of quote summaries
   */
  findQuotes(leadId: string): Promise<QuoteSummary[]>;

  /**
   * Build Timeline for a Lead
   *
   * Aggregates activities, opportunity events, quote events
   *
   * @param leadId - Lead UUID
   * @returns Sorted timeline entries (newest first)
   */
  findTimeline(leadId: string): Promise<TimelineEntry[]>;
}
