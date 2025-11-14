import { BaseRepository } from "@/lib/core/base.repository";
import { PrismaClient, crm_leads } from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PrismaTransaction } from "@/lib/core/types";

/**
 * Whitelist of fields allowed for sorting leads.
 * Excludes PII (phone), notes, metadata, and soft-delete fields.
 */
export const LEAD_SORT_FIELDS = [
  "id",
  "lead_code",
  "email",
  "first_name",
  "last_name",
  "company_name",
  "status",
  "lead_stage",
  "fit_score",
  "engagement_score",
  "qualification_score",
  "created_at",
  "updated_at",
  "qualified_date",
  "converted_date",
] as const satisfies SortFieldWhitelist;

/**
 * Base Lead type from Prisma
 */
export type Lead = crm_leads;

/**
 * Lead with relations (assigned employee and source)
 */
export type LeadWithRelations = crm_leads & {
  adm_provider_employees_crm_leads_assigned_toToadm_provider_employees?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  crm_lead_sources?: {
    id: string;
    name: string;
  } | null;
};

/**
 * Repository for managing CRM leads
 *
 * Note: crm_leads table does NOT have tenant_id column.
 * Multi-tenant isolation is handled via assigned_to (employee → tenant).
 */
export class LeadRepository extends BaseRepository<Lead> {
  constructor(prisma: PrismaClient) {
    super(prisma.crm_leads, prisma);
  }

  /**
   * Get whitelist of fields allowed for sorting
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return LEAD_SORT_FIELDS;
  }

  /**
   * Find a lead by email address (case insensitive)
   *
   * @param email - Email address to search (case insensitive)
   * @returns Lead with relations or null if not found
   *
   * @example
   * ```typescript
   * const lead = await leadRepo.findByEmail('contact@example.com');
   * if (lead) {
   *   // Access assigned employee and source
   *   const employee = lead.adm_provider_employees_crm_leads_assigned_toToadm_provider_employees;
   *   const source = lead.crm_lead_sources;
   * }
   * ```
   */
  async findByEmail(email: string): Promise<LeadWithRelations | null> {
    return await this.model.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive", // Case insensitive search
        },
        deleted_at: null, // Exclude soft-deleted leads
      },
      include: {
        // Include assigned employee (if any)
        adm_provider_employees_crm_leads_assigned_toToadm_provider_employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        // Include lead source (if any)
        crm_lead_sources: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Count active leads assigned to a specific employee
   *
   * Active leads have status: 'new', 'working', or 'qualified'
   *
   * @param assignedTo - UUID of the assigned employee
   * @returns Count of active leads (excludes converted, lost, soft-deleted)
   *
   * @example
   * ```typescript
   * const activeCount = await leadRepo.countActiveLeads('employee-uuid');
   * // Returns number of active leads for the employee
   * ```
   */
  async countActiveLeads(assignedTo: string): Promise<number> {
    return await this.model.count({
      where: {
        assigned_to: assignedTo,
        status: {
          in: ["new", "working", "qualified"], // Active statuses only
        },
        deleted_at: null, // Exclude soft-deleted leads
      },
    });
  }

  /**
   * Generate a unique lead code for the given year
   * Format: LEAD-YYYY-NNNNN (e.g., LEAD-2025-00001)
   *
   * Sequence resets at the beginning of each calendar year.
   * Supports optional transaction context for atomic lead creation.
   *
   * Note: This method does NOT handle retry logic. Race conditions
   * causing unique constraint violations (P2002) should be handled
   * at the service layer by re-calling this method.
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction for atomic operations
   * @returns Next available unique lead code for the year
   *
   * @example
   * ```typescript
   * // Outside transaction
   * const code = await repository.generateLeadCode(2025);
   * // Returns: 'LEAD-2025-00001' (first of year)
   * ```
   *
   * @example
   * ```typescript
   * // Inside transaction (atomic lead creation)
   * await prisma.$transaction(async (tx) => {
   *   const code = await repository.generateLeadCode(2025, tx);
   *   const lead = await tx.crm_leads.create({
   *     data: { lead_code: code, ...data }
   *   });
   *   return lead;
   * });
   * ```
   */
  async generateLeadCode(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    // 1. Determine model (transaction-aware)
    const model = tx ? tx.crm_leads : this.model;

    // 2. Construire le préfixe pour l'année
    const prefix = `LEAD-${year}-`;

    // 3. Trouver le dernier lead_code de l'année (tri alphabétique DESC)
    const lastLead = await model.findFirst({
      where: {
        lead_code: { startsWith: prefix },
        deleted_at: null, // Exclure soft-deleted
      },
      orderBy: { lead_code: "desc" }, // Tri DESC => dernier en premier
      select: { lead_code: true }, // Optimisation: charger uniquement lead_code
    });

    // 4. Calculer le prochain numéro de séquence
    let nextSequence = 1; // Défaut: premier lead de l'année

    if (lastLead?.lead_code) {
      // Extraire le numéro séquentiel du dernier code
      const parts = lastLead.lead_code.split("-"); // ['LEAD', '2025', '00042']

      if (parts.length === 3) {
        const currentSeq = parseInt(parts[2], 10); // 42

        // Si parsing réussit (pas NaN), incrémenter
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1; // 43
        }
        // Si parsing échoue (format invalide), garder nextSequence = 1
      }
      // Si split ne donne pas 3 parties, garder nextSequence = 1
    }

    // 5. Formater avec padding 5 chiffres minimum
    const paddedSeq = nextSequence.toString().padStart(5, "0");

    // 6. Retourner le code complet
    return `${prefix}${paddedSeq}`;
  }
}
