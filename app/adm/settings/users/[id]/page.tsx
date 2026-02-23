import { UserDetailPage } from "@/features/settings/components/user-detail-page";

export const dynamic = "force-dynamic";

export default async function SettingsUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetailPage userId={id} />;
}
