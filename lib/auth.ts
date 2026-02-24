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
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins/organization";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME } from "@/lib/config/email.config";
import { URLS, buildAppUrl } from "@/lib/config/urls.config";
import { defaultLocale } from "@/lib/i18n/locales";
import { sendNotification } from "@/lib/notifications";

// ── Resend singleton (lazy) — used by Better Auth invitation hook ────────────

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
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes — avoids DB lookup on every getSession()
    },
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
      const firstName = user.name?.split(" ")[0] ?? "";
      await sendNotification("admin.member.password_reset", user.email, {
        first_name: firstName,
        reset_link: url,
        expiry_hours: "24",
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
        before: async (session) => {
          try {
            const memberships = await prisma.auth_member.findMany({
              where: { user_id: session.userId },
              select: {
                organization_id: true,
                organization: {
                  select: { metadata: true },
                },
              },
            });

            if (memberships.length === 0) {
              return;
            }

            // Prioritize HQ org (is_headquarters: true in metadata)
            let targetOrgId = memberships[0].organization_id;

            for (const m of memberships) {
              const raw = m.organization?.metadata;
              if (raw) {
                try {
                  const meta = JSON.parse(raw) as Record<string, unknown>;
                  if (meta?.is_headquarters === true) {
                    targetOrgId = m.organization_id;
                    break;
                  }
                } catch {
                  // Invalid JSON metadata — skip
                }
              }
            }

            return {
              data: {
                ...session,
                activeOrganizationId: targetOrgId,
              },
            };
          } catch {
            // Never crash login — session created without org if hook fails
          }
        },
        after: async (session) => {
          try {
            // Update last_login_at on adm_members for this user
            await prisma.adm_members.updateMany({
              where: {
                auth_user_id: session.userId,
                deleted_at: null,
              },
              data: { last_login_at: new Date() },
            });

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
      teams: { enabled: true },
      schema: {
        session: {
          fields: {
            activeOrganizationId: "active_organization_id",
            activeTeamId: "active_team_id",
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
            teamId: "team_id",
          },
        },
        team: {
          modelName: "auth_team",
          fields: {
            organizationId: "organization_id",
            createdAt: "created_at",
            updatedAt: "updated_at",
          },
        },
        teamMember: {
          modelName: "auth_team_member",
          fields: {
            teamId: "team_id",
            userId: "user_id",
            createdAt: "created_at",
          },
        },
      },
      sendInvitationEmail: async ({ email, id }) => {
        const inviteUrl = buildAppUrl(
          `/${defaultLocale}/accept-invitation?id=${id}`
        );
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1a1a2e; padding: 24px 32px; text-align: center;">
              <span style="font-size: 24px; font-weight: 700; color: #ffffff; text-decoration: none;">FleetCore</span>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">You've been invited to FleetCore</h2>
              <p style="color: #525f7f; font-size: 16px; line-height: 24px;">Click the button below to accept the invitation and set up your account:</p>
              <p style="margin: 28px 0; text-align: center;">
                <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Accept Invitation</a>
              </p>
              <p style="color: #666; font-size: 14px; line-height: 22px;">This invitation expires in 7 days. If you didn't expect this email, you can ignore it.</p>
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 24px 0;" />
              <p style="color: #8898aa; font-size: 12px; line-height: 16px;">FleetCore — Fleet Management Platform</p>
            </div>
          </div>
        `.trim();

        await getResend().emails.send({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
          to: email,
          subject: "You've been invited to FleetCore",
          html,
        });
      },

      // ── Hook: sync auth_member → adm_members on invitation acceptance ──────
      organizationHooks: {
        afterAcceptInvitation: async ({ member, user }) => {
          try {
            // Check if adm_members entry already exists for this user+tenant
            const existing = await prisma.adm_members.findFirst({
              where: {
                auth_user_id: user.id,
                tenant_id: member.organizationId,
              },
            });

            if (existing) {
              return; // adm_members already exists for this user+tenant
            }

            // Parse name into first/last
            const nameParts = (user.name ?? "").trim().split(/\s+/);
            const firstName = nameParts[0] || null;
            const lastName =
              nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

            // Map org role → business role
            const ORG_ROLE_MAP: Record<string, string> = {
              owner: "admin",
              admin: "admin",
              "org:adm_admin": "admin",
              member: "member",
            };
            const businessRole = ORG_ROLE_MAP[member.role] ?? "member";

            await prisma.adm_members.create({
              data: {
                tenant_id: member.organizationId,
                auth_user_id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                role: businessRole,
                status: "active",
              },
            });
          } catch {
            // Non-blocking: hook failure must not break invitation acceptance
          }
        },
      },
    }),
    admin({
      schema: {
        user: {
          fields: {
            banReason: "ban_reason",
            banExpires: "ban_expires",
          },
        },
        session: {
          fields: {
            impersonatedBy: "impersonated_by",
          },
        },
      },
    }),
    nextCookies(), // MUST be last plugin
  ],
});

// Export auth type for client inference
export type Auth = typeof auth;
