/**
 * Invitation Email Sender
 *
 * Sends invitation emails via Resend and logs them in adm_notification_logs.
 * Reuses the same Resend integration as Better Auth's sendInvitationEmail hook.
 *
 * @module lib/services/notification/invitation-email
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME } from "@/lib/config/email.config";
import { buildAppUrl } from "@/lib/config/urls.config";
import { defaultLocale } from "@/lib/i18n/locales";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(apiKey);
  }
  return _resend;
}

interface SendInvitationEmailParams {
  email: string;
  invitationId: string;
  tenantId?: string;
  tenantName?: string;
  inviterName?: string;
}

interface SendInvitationEmailResult {
  emailSent: boolean;
  error?: string;
}

/**
 * Send an invitation email via Resend and log it in adm_notification_logs.
 *
 * The email contains a link to the accept-invitation page where the user
 * can create their account (or sign in if they already have one).
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<SendInvitationEmailResult> {
  const { email, invitationId, tenantId, tenantName, inviterName } = params;

  const inviteUrl = buildAppUrl(
    `/${defaultLocale}/accept-invitation?id=${invitationId}`
  );

  const orgLine = tenantName ? ` to <strong>${tenantName}</strong>` : "";
  const inviterLine = inviterName
    ? `<p style="color: #525f7f; font-size: 16px; line-height: 24px;">${inviterName} has invited you${orgLine}.</p>`
    : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a1a2e; padding: 24px 32px; text-align: center;">
        <span style="font-size: 24px; font-weight: 700; color: #ffffff; text-decoration: none;">FleetCore</span>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">You've been invited to FleetCore</h2>
        ${inviterLine}
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

  try {
    const result = await getResend().emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: "You've been invited to FleetCore",
      html,
    });

    // Log in adm_notification_logs for audit trail
    try {
      await prisma.adm_notification_logs.create({
        data: {
          tenant_id: tenantId ?? null,
          recipient_email: email,
          template_code: "member_invitation",
          channel: "email",
          locale_used: defaultLocale,
          subject: "You've been invited to FleetCore",
          body: html,
          variables_data: {
            invitationId,
            tenantName: tenantName ?? null,
            inviterName: inviterName ?? null,
            inviteUrl,
          },
          status: "sent",
          sent_at: new Date(),
          external_id: result.data?.id ?? null,
        },
      });
    } catch {
      // Non-blocking: notification log failure must not break the flow
    }

    return { emailSent: true };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Email send failed";

    // Log failure
    try {
      await prisma.adm_notification_logs.create({
        data: {
          tenant_id: tenantId ?? null,
          recipient_email: email,
          template_code: "member_invitation",
          channel: "email",
          locale_used: defaultLocale,
          subject: "You've been invited to FleetCore",
          status: "failed",
          failed_at: new Date(),
          error_message: errorMessage,
        },
      });
    } catch {
      // Non-blocking
    }

    return { emailSent: false, error: errorMessage };
  }
}
