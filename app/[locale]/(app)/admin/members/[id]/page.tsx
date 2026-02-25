import { MemberDetailPage } from "@/features/settings/components/member-detail-page";

export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetailPage memberId={id} />;
}
