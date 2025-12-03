/**
 * Settings Index Page - Redirects to CRM Settings
 *
 * This page redirects users to the default settings section (CRM).
 * As more settings sections are added, this could become a landing page.
 */

import { redirect } from "next/navigation";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;

  // Redirect to CRM Settings (default settings section)
  redirect(`/${locale}/settings/crm`);
}
