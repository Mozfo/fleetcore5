import PageContainer from "@/components/layout/page-container";
import { LeadsListPage } from "@/features/crm/leads/components/leads-list-page";

export default function LeadsRefineTestPage() {
  return (
    <PageContainer
      pageTitle="Leads — Refine Test"
      pageDescription="Phase 2 Step 4: DataTable + Refine with real data"
    >
      <LeadsListPage />
    </PageContainer>
  );
}
