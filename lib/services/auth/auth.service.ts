/**
 * Auth Service - V7.0.0
 * Better Auth Organization management
 *
 * This service handles:
 * - Creating organizations via Better Auth admin API
 * - Inviting admin users to organizations
 * - Updating organization metadata (direct Prisma -- same DB)
 * - Looking up organizations by tenant ID (direct Prisma)
 *
 * Used by CustomerConversionService for immediate org creation
 * after Stripe checkout completes.
 *
 * @module lib/services/auth/auth.service
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { OrgRole } from "@/lib/config/permissions";

// ===== TYPES & INTERFACES =====

/**
 * Input for creating an organization
 */
export interface CreateOrganizationInput {
  name: string;
  tenantId: string;
  metadata?: {
    tenantCode?: string;
    segment?: string;
    segmentLabel?: string;
    isSaas?: boolean;
    planCode?: string;
  };
}

/**
 * Result of organization creation
 */
export interface CreateOrganizationResult {
  success: boolean;
  organizationId?: string;
  error?: string;
}

/**
 * Input for inviting an admin
 */
export interface InviteAdminInput {
  organizationId: string;
  email: string;
  name?: string;
  role?: OrgRole;
  /** ID of the user creating the invitation. Falls back to org owner. */
  inviterId?: string;
}

/**
 * Result of admin invitation
 */
export interface InviteAdminResult {
  success: boolean;
  invitationId?: string;
  error?: string;
}

// ===== SERVICE CLASS =====

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // =========================================================================
  // ORGANIZATION METHODS
  // =========================================================================

  /**
   * Create an organization via Better Auth admin API
   *
   * This is called immediately after successful Stripe checkout,
   * NOT waiting for any webhook. The organization is created in
   * auth_organization table via Better Auth, then we link it to
   * adm_tenants.
   *
   * Metadata is stored as JSON string in auth_organization.metadata.
   */
  async createOrganization(
    input: CreateOrganizationInput
  ): Promise<CreateOrganizationResult> {
    const { name, tenantId, metadata } = input;

    logger.info(
      { name, tenantId, metadata },
      "[AuthService] Creating organization"
    );

    try {
      // TODO: Replace with auth.api.createOrganization() when Better Auth
      // organization admin API supports server-side creation without a
      // user session context. For now, create directly via Prisma since
      // auth_organization lives in our DB.
      const organizationId = crypto.randomUUID();

      const metadataPayload = JSON.stringify({
        tenantId,
        tenantCode: metadata?.tenantCode,
        segment: metadata?.segment,
        segmentLabel: metadata?.segmentLabel,
        isSaas: metadata?.isSaas,
        planCode: metadata?.planCode,
        createdBy: "customer_conversion",
      });

      await prisma.auth_organization.create({
        data: {
          id: organizationId,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          metadata: metadataPayload,
          created_at: new Date(),
        },
      });

      logger.info(
        { organizationId, tenantId },
        "[AuthService] Organization created successfully"
      );

      return {
        success: true,
        organizationId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error: errorMessage, name, tenantId },
        "[AuthService] Failed to create organization"
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Invite an admin user to an organization
   *
   * Uses Better Auth organization plugin invitation API.
   * The admin receives an email invitation via the sendInvitationEmail
   * callback configured in lib/auth.ts.
   */
  async inviteAdmin(input: InviteAdminInput): Promise<InviteAdminResult> {
    const { organizationId, email, role = "org:adm_admin" } = input;

    logger.info(
      { organizationId, email, role },
      "[AuthService] Inviting admin to organization"
    );

    try {
      // TODO: Replace with auth.api.organization.inviteMember() when Better Auth
      // organization admin API supports server-side invitation without a user
      // session context. For now, create the invitation directly via Prisma.
      const invitationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Resolve inviter: use provided ID or fall back to org owner
      let inviterId = input.inviterId;
      if (!inviterId) {
        const owner = await prisma.auth_member.findFirst({
          where: { organization_id: organizationId, role: "org:adm_admin" },
          select: { user_id: true },
        });
        inviterId = owner?.user_id ?? organizationId; // last-resort fallback
      }

      await prisma.auth_invitation.create({
        data: {
          id: invitationId,
          organization_id: organizationId,
          email,
          role,
          status: "pending",
          expires_at: expiresAt,
          inviter_id: inviterId,
          created_at: new Date(),
        },
      });

      logger.info(
        { invitationId, email, organizationId },
        "[AuthService] Admin invitation created"
      );

      return {
        success: true,
        invitationId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error: errorMessage, organizationId, email },
        "[AuthService] Failed to invite admin"
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update organization metadata
   *
   * With Better Auth, the organization lives in our DB (auth_organization).
   * We can update metadata directly via Prisma -- no external API call needed.
   */
  async updateOrganizationMetadata(
    organizationId: string,
    metadata: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Read current metadata, merge, and write back
      const org = await prisma.auth_organization.findUnique({
        where: { id: organizationId },
        select: { metadata: true },
      });

      let existing: Record<string, unknown> = {};
      if (org?.metadata) {
        try {
          existing = JSON.parse(org.metadata) as Record<string, unknown>;
        } catch {
          // Invalid JSON -- start fresh
        }
      }

      const merged = { ...existing, ...metadata };

      await prisma.auth_organization.update({
        where: { id: organizationId },
        data: { metadata: JSON.stringify(merged) },
      });

      logger.info(
        { organizationId, metadata },
        "[AuthService] Organization metadata updated"
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error: errorMessage, organizationId },
        "[AuthService] Failed to update organization metadata"
      );

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get organization by tenant ID
   *
   * With Better Auth, organizations are in our DB.
   * We search auth_organization.metadata JSON for matching tenantId.
   */
  async getOrganizationByTenantId(
    tenantId: string
  ): Promise<{ organizationId: string | null }> {
    try {
      // Search for org with matching tenantId in metadata
      // metadata is a JSON string field
      const orgs = await prisma.auth_organization.findMany({
        select: { id: true, metadata: true },
      });

      const org = orgs.find((o) => {
        if (!o.metadata) return false;
        try {
          const meta = JSON.parse(o.metadata) as Record<string, unknown>;
          return meta?.tenantId === tenantId;
        } catch {
          return false;
        }
      });

      return { organizationId: org?.id ?? null };
    } catch (error) {
      logger.error(
        { error, tenantId },
        "[AuthService] Failed to get organization by tenant ID"
      );
      return { organizationId: null };
    }
  }
}

// Export singleton
export const authService = AuthService.getInstance();
