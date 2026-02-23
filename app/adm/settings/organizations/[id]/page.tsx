import { OrgDetailPage } from "@/features/settings/components/org-detail-page";

export const dynamic = "force-dynamic";

export default async function SettingsOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrgDetailPage orgId={id} />;
}
