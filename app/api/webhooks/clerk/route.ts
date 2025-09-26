import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id!,
      "svix-timestamp": svix_timestamp!,
      "svix-signature": svix_signature!,
    }) as WebhookEvent;
  } catch {
    return new Response("Error verifying webhook", { status: 400 });
  }

  if (evt.type === "organization.created") {
    try {
      await prisma.organization.create({
        data: {
          clerk_org_id: evt.data.id,
          name: evt.data.name,
          subdomain: evt.data.slug,
          country_code: "AE",
        },
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
      return new Response("Error creating tenant", { status: 500 });
    }
  }

  if (evt.type === "organizationMembership.created") {
    try {
      const org = await prisma.organization.findUnique({
        where: { clerk_org_id: evt.data.organization.id },
      });

      if (org) {
        await prisma.member.create({
          data: {
            tenant_id: org.id,
            clerk_id: evt.data.public_user_data.user_id,
            email: evt.data.public_user_data.identifier,
            role: evt.data.role === "org:admin" ? "admin" : "member",
          },
        });
      }
    } catch (error) {
      console.error("Error creating member:", error);
      return new Response("Error creating member", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
