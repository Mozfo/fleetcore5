import { TenantDetailPage } from "@/features/settings/components/tenant-detail-page";

export const dynamic = "force-dynamic";

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TenantDetailPage tenantId={id} />;
}
