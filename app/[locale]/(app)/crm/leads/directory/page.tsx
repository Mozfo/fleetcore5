/**
 * Redirect: Directory page is now deprecated
 * Redirects to the new Reports page
 */

import { redirect } from "next/navigation";

interface DirectoryPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LeadsDirectoryPage({
  params,
}: DirectoryPageProps) {
  const { locale } = await params;

  // Redirect to the new Reports page
  redirect(`/${locale}/crm/leads/reports`);
}
