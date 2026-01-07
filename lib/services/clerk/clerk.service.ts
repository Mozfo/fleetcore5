/**
 * Clerk Service - V6.2.1
 * Proactive Clerk Organization management
 *
 * This service handles:
 * - Creating organizations proactively (not waiting for webhook)
 * - Inviting admin users to organizations
 * - Syncing tenant metadata to Clerk
 *
 * Used by CustomerConversionService for immediate org creation
 * after Stripe checkout completes.
 *
 * @module lib/services/clerk/clerk.service
 */

import { clerkClient } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

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
  role?: "org:admin" | "org:member";
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

export class ClerkService {
  private static instance: ClerkService;

  private constructor() {}

  public static getInstance(): ClerkService {
    if (!ClerkService.instance) {
      ClerkService.instance = new ClerkService();
    }
    return ClerkService.instance;
  }

  // =========================================================================
  // ORGANIZATION METHODS
  // =========================================================================

  /**
   * Create a Clerk organization proactively
   *
   * This is called immediately after successful Stripe checkout,
   * NOT waiting for Clerk webhook to create the org.
   *
   * The tenantId is stored in publicMetadata for JWT injection.
   */
  async createOrganization(
    input: CreateOrganizationInput
  ): Promise<CreateOrganizationResult> {
    const { name, tenantId, metadata } = input;

    logger.info(
      { name, tenantId, metadata },
      "[ClerkService] Creating organization"
    );

    try {
      const client = await clerkClient();

      // Create organization with tenantId in publicMetadata
      const organization = await client.organizations.createOrganization({
        name,
        publicMetadata: {
          tenantId,
          tenantCode: metadata?.tenantCode,
          segment: metadata?.segment,
          segmentLabel: metadata?.segmentLabel,
          isSaas: metadata?.isSaas,
          planCode: metadata?.planCode,
          createdBy: "customer_conversion",
        },
      });

      logger.info(
        { organizationId: organization.id, tenantId },
        "[ClerkService] Organization created successfully"
      );

      return {
        success: true,
        organizationId: organization.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error: errorMessage, name, tenantId },
        "[ClerkService] Failed to create organization"
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
   * Called after verification form is completed.
   * The admin receives an email invitation from Clerk.
   */
  async inviteAdmin(input: InviteAdminInput): Promise<InviteAdminResult> {
    const { organizationId, email, role = "org:admin" } = input;

    logger.info(
      { organizationId, email, role },
      "[ClerkService] Inviting admin to organization"
    );

    try {
      const client = await clerkClient();

      const invitation =
        await client.organizations.createOrganizationInvitation({
          organizationId,
          emailAddress: email,
          role,
          inviterUserId: undefined, // System invitation
        });

      logger.info(
        { invitationId: invitation.id, email, organizationId },
        "[ClerkService] Admin invitation sent"
      );

      return {
        success: true,
        invitationId: invitation.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error: errorMessage, organizationId, email },
        "[ClerkService] Failed to invite admin"
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
   * Used to sync additional tenant data to Clerk after creation.
   */
  async updateOrganizationMetadata(
    organizationId: string,
    metadata: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = await clerkClient();

      await client.organizations.updateOrganizationMetadata(organizationId, {
        publicMetadata: metadata,
      });

      logger.info(
        { organizationId, metadata },
        "[ClerkService] Organization metadata updated"
      );

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error: errorMessage, organizationId },
        "[ClerkService] Failed to update organization metadata"
      );

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get organization by tenant ID
   *
   * Searches for an organization with matching tenantId in publicMetadata.
   * Used for idempotence checks.
   */
  async getOrganizationByTenantId(
    tenantId: string
  ): Promise<{ organizationId: string | null }> {
    try {
      const client = await clerkClient();

      // Note: Clerk doesn't have a direct filter by metadata
      // We need to list and filter manually (or use our DB)
      const orgs = await client.organizations.getOrganizationList({
        limit: 100,
      });

      const org = orgs.data.find(
        (o) =>
          (o.publicMetadata as Record<string, unknown>)?.tenantId === tenantId
      );

      return { organizationId: org?.id || null };
    } catch (error) {
      logger.error(
        { error, tenantId },
        "[ClerkService] Failed to get organization by tenant ID"
      );
      return { organizationId: null };
    }
  }
}

// Export singleton
export const clerkService = ClerkService.getInstance();
