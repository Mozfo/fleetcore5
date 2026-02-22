/**
 * Better Auth — Server Configuration
 *
 * Central auth config for FleetCore.
 * Uses Prisma adapter with PostgreSQL, organization plugin,
 * and email/password authentication via Resend.
 *
 * @module lib/auth
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins/organization";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME } from "@/lib/config/email.config";
import { URLS } from "@/lib/config/urls.config";

// ── Resend singleton (lazy) ────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(apiKey);
  }
  return _resend;
}

// ── Auth instance ──────────────────────────────────────────────────────────────

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // ── Table + column mappings (auth_* prefix, snake_case) ────────────────────

  user: {
    modelName: "auth_user",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  session: {
    modelName: "auth_session",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  account: {
    modelName: "auth_account",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  verification: {
    modelName: "auth_verification",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },

  // ── End mappings ───────────────────────────────────────────────────────────

  trustedOrigins: [URLS.app],

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await getResend().emails.send({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
        to: user.email,
        subject: "Reset your FleetCore password",
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "auth_rate_limit",
    fields: {
      lastRequest: "last_request",
    },
    customRules: {
      "/sign-in/email": { max: 5, window: 60 },
      "/sign-up/email": { max: 3, window: 60 },
      "/forget-password": { max: 3, window: 300 },
    },
  },

  advanced: {
    database: { generateId: () => crypto.randomUUID() },
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const registrationEnabled =
            process.env.NEXT_PUBLIC_ENABLE_PUBLIC_REGISTRATION === "true";

          if (registrationEnabled) return;

          // Registration disabled — only allow signup if a pending invitation exists
          const pendingInvitation = await prisma.auth_invitation.findFirst({
            where: {
              email: user.email.toLowerCase(),
              status: "pending",
            },
          });

          if (!pendingInvitation) {
            return false; // Block user creation
          }

          // Invitation exists — allow signup to proceed
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          try {
            await prisma.adm_audit_logs.create({
              data: {
                tenant_id: "00000000-0000-0000-0000-000000000000", // system tenant placeholder
                entity: "session",
                entity_id: session.id,
                action: "login",
                ip_address: session.ipAddress ?? null,
                user_agent: session.userAgent ?? null,
                new_values: { userId: session.userId },
                severity: "info",
                category: "operational",
              },
            });
          } catch {
            // Non-blocking: login audit failure must not break auth flow
          }
        },
      },
    },
  },

  plugins: [
    organization({
      schema: {
        session: {
          fields: {
            activeOrganizationId: "active_organization_id",
          },
        },
        organization: {
          modelName: "auth_organization",
          fields: {
            createdAt: "created_at",
          },
        },
        member: {
          modelName: "auth_member",
          fields: {
            organizationId: "organization_id",
            userId: "user_id",
            createdAt: "created_at",
          },
        },
        invitation: {
          modelName: "auth_invitation",
          fields: {
            organizationId: "organization_id",
            expiresAt: "expires_at",
            createdAt: "created_at",
            inviterId: "inviter_id",
          },
        },
      },
      sendInvitationEmail: async ({ email, id }) => {
        const inviteUrl = `${URLS.app}/en/accept-invitation?id=${id}`;
        await getResend().emails.send({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
          to: email,
          subject: "You've been invited to FleetCore",
          html: `<p>You've been invited to join FleetCore. <a href="${inviteUrl}">Accept invitation</a></p>`,
        });
      },
    }),
    nextCookies(), // MUST be last plugin
  ],
});

// Export auth type for client inference
export type Auth = typeof auth;
