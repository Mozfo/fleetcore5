import { auth } from "@clerk/nextjs/server";
import { localizedRedirect } from "@/lib/navigation";
import { CrmDashboardPage } from "@/features/crm/dashboard/components/crm-dashboard-page";

interface CrmPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CrmPage({ params }: CrmPageProps) {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  return <CrmDashboardPage />;
}
