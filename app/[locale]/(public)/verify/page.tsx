/**
 * Customer Verification Page - V6.2-8b
 *
 * Public page for customers to complete their account verification after Stripe checkout.
 *
 * URL: /[locale]/verify?token=xxx
 *
 * Flow:
 * 1. Extract token from query params
 * 2. Validate token via API
 * 3. Show form if valid, error message if not
 * 4. On submit, redirect to success page
 *
 * @module app/[locale]/(public)/verify/page
 */

import { Suspense } from "react";
import VerificationContent from "./verification-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        }
      >
        <VerificationContent token={token} locale={locale} />
      </Suspense>
    </div>
  );
}
