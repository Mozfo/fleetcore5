"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("__clerk_invitation_token");
  const ticket = searchParams.get("__clerk_ticket");

  if (!inviteToken && !ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Invalid Invitation
          </h2>
          <p className="text-gray-600">
            This invitation link is invalid or has expired. Please contact your
            administrator for a new invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "bg-white shadow-xl rounded-2xl",
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-gray-600",
            formButtonPrimary:
              "bg-gradient-to-r from-blue-600 to-purple-700 hover:shadow-lg",
            formFieldInput: "border-gray-300 focus:border-blue-600",
            footerActionLink: "text-blue-600 hover:text-blue-700",
          },
        }}
      />
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
