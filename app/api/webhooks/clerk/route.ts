import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import {
  auditLog,
  getIpFromRequest,
  getUserAgentFromRequest,
} from "@/lib/audit";
import { assertDefined } from "@/lib/core/errors";
import {
  setTenantIdInCache,
  deleteTenantFromCache,
} from "@/lib/cache/tenant-mapping";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const webhookSecret = assertDefined(
    process.env.CLERK_WEBHOOK_SECRET,
    "CLERK_WEBHOOK_SECRET is not configured"
  );

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": assertDefined(svix_id, "Missing svix-id header"),
      "svix-timestamp": assertDefined(
        svix_timestamp,
        "Missing svix-timestamp header"
      ),
      "svix-signature": assertDefined(
        svix_signature,
        "Missing svix-signature header"
      ),
    }) as WebhookEvent;
  } catch (_error: unknown) {
    // Error non utilisé mais typé explicitement (bonne pratique TypeScript)
    return new Response("Error verifying webhook", { status: 400 });
  }

  const ipAddress = getIpFromRequest(headerPayload);
  const userAgent = getUserAgentFromRequest(headerPayload);

  // Organization created
  if (evt.type === "organization.created") {
    try {
      const organization = await prisma.adm_tenants.create({
        data: {
          clerk_organization_id: evt.data.id,
          name: evt.data.name,
          // subdomain: evt.data.slug,
          country_code: "AE",
        },
      });

      // Warm cache proactively
      await setTenantIdInCache(evt.data.id, organization.id);

      await auditLog({
        tenantId: organization.id,
        action: "create",
        entityType: "organization",
        entityId: organization.id,
        snapshot: {
          clerk_organization_id: organization.clerk_organization_id,
          name: organization.name,
          country_code: organization.country_code,
        },
        performedBy: "Clerk Webhook",
        performedByClerkId: evt.data.created_by,
        ipAddress,
        userAgent,
        metadata: { source: "clerk_webhook", event_type: evt.type },
      });
    } catch (error: unknown) {
      return new Response(
        `Error creating organization: ${error instanceof Error ? error.message : "Unknown"}`,
        { status: 500 }
      );
    }
  }

  // Organization updated
  if (evt.type === "organization.updated") {
    try {
      const org = await prisma.adm_tenants.findFirst({
        where: { clerk_organization_id: evt.data.id },
      });

      if (org) {
        const oldSnapshot = { name: org.name };

        const updated = await prisma.adm_tenants.update({
          where: { clerk_organization_id: evt.data.id },
          data: {
            name: evt.data.name,
            // subdomain: evt.data.slug,
          },
        });

        // Warm cache proactively
        await setTenantIdInCache(evt.data.id, org.id);

        await auditLog({
          tenantId: org.id,
          action: "update",
          entityType: "organization",
          entityId: org.id,
          snapshot: oldSnapshot,
          changes: {
            name: { old: org.name, new: updated.name },
          },
          performedBy: "Clerk Webhook",
          ipAddress,
          userAgent,
          metadata: { source: "clerk_webhook", event_type: evt.type },
        });
      }
    } catch (error: unknown) {
      return new Response(
        `Error updating organization: ${error instanceof Error ? error.message : "Unknown"}`,
        { status: 500 }
      );
    }
  }

  // Organization deleted
  if (evt.type === "organization.deleted") {
    try {
      const org = await prisma.adm_tenants.findUnique({
        where: { clerk_organization_id: evt.data.id },
      });

      if (org && evt.data.id) {
        await prisma.adm_tenants.update({
          where: { clerk_organization_id: evt.data.id },
          data: {
            deleted_at: new Date(),
          },
        });

        // Invalidate cache immediately
        await deleteTenantFromCache(evt.data.id);

        await auditLog({
          tenantId: org.id,
          action: "delete",
          entityType: "organization",
          entityId: org.id,
          snapshot: {
            clerk_organization_id: org.clerk_organization_id,
            name: org.name,
          },
          performedBy: "Clerk Webhook",
          ipAddress,
          userAgent,
          reason: "Organization deleted in Clerk",
          metadata: { source: "clerk_webhook", event_type: evt.type },
        });
      }
    } catch (error: unknown) {
      return new Response(
        `Error deleting organization: ${error instanceof Error ? error.message : "Unknown"}`,
        { status: 500 }
      );
    }
  }

  // Member created
  if (evt.type === "organizationMembership.created") {
    try {
      const org = await prisma.adm_tenants.findUnique({
        where: { clerk_organization_id: evt.data.organization.id },
      });

      if (org) {
        const member = await prisma.adm_members.create({
          data: {
            tenant_id: org.id,
            clerk_user_id: evt.data.public_user_data.user_id,
            email: evt.data.public_user_data.identifier,
            role: evt.data.role === "org:admin" ? "admin" : "member",
          },
        });

        await auditLog({
          tenantId: org.id,
          action: "create",
          entityType: "member",
          entityId: member.id,
          snapshot: {
            clerk_id: member.clerk_user_id,
            email: member.email,
            role: member.role,
          },
          performedBy: "Clerk Webhook",
          performedByClerkId: evt.data.public_user_data.user_id,
          ipAddress,
          userAgent,
          metadata: { source: "clerk_webhook", event_type: evt.type },
        });
      }
    } catch (error: unknown) {
      return new Response(
        `Error creating member: ${error instanceof Error ? error.message : "Unknown"}`,
        { status: 500 }
      );
    }
  }

  // Member updated
  if (evt.type === "organizationMembership.updated") {
    try {
      const org = await prisma.adm_tenants.findUnique({
        where: { clerk_organization_id: evt.data.organization.id },
      });

      if (org) {
        const existingMember = await prisma.adm_members.findFirst({
          where: {
            tenant_id: org.id,
            clerk_user_id: evt.data.public_user_data.user_id,
          },
        });

        if (existingMember) {
          const oldRole = existingMember.role;
          const newRole = evt.data.role === "org:admin" ? "admin" : "member";

          await prisma.adm_members.update({
            where: { id: existingMember.id },
            data: { role: newRole },
          });

          await auditLog({
            tenantId: org.id,
            action: "update",
            entityType: "member",
            entityId: existingMember.id,
            changes: {
              role: { old: oldRole, new: newRole },
            },
            performedBy: "Clerk Webhook",
            ipAddress,
            userAgent,
            metadata: { source: "clerk_webhook", event_type: evt.type },
          });
        }
      }
    } catch (error: unknown) {
      return new Response(
        `Error updating member: ${error instanceof Error ? error.message : "Unknown"}`,
        { status: 500 }
      );
    }
  }

  // Member deleted
  if (evt.type === "organizationMembership.deleted") {
    try {
      const org = await prisma.adm_tenants.findUnique({
        where: { clerk_organization_id: evt.data.organization.id },
      });

      if (org) {
        const member = await prisma.adm_members.findFirst({
          where: {
            tenant_id: org.id,
            clerk_user_id: evt.data.public_user_data.user_id,
          },
        });

        if (member) {
          await prisma.adm_members.update({
            where: { id: member.id },
            data: {
              deleted_at: new Date(),
              deleted_by: "Clerk Webhook",
            },
          });

          await auditLog({
            tenantId: org.id,
            action: "delete",
            entityType: "member",
            entityId: member.id,
            snapshot: {
              clerk_id: member.clerk_user_id,
              email: member.email,
              role: member.role,
            },
            performedBy: "Clerk Webhook",
            ipAddress,
            userAgent,
            reason: "Member removed from organization in Clerk",
            metadata: { source: "clerk_webhook", event_type: evt.type },
          });
        }
      }
    } catch (error: unknown) {
      return new Response(
        `Error deleting member: ${error instanceof Error ? error.message : "Unknown"}`,
        { status: 500 }
      );
    }
  }

  return new Response("", { status: 200 });
}
