import { getSession } from "@/lib/auth/server";
import { localizedRedirect } from "@/lib/navigation";
import { CrmDashboardPage } from "@/features/crm/dashboard/components/crm-dashboard-page";

interface CrmPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CrmPage({ params }: CrmPageProps) {
  const session = await getSession();
  const { locale } = await params;

  if (!session) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  return <CrmDashboardPage />;
}
