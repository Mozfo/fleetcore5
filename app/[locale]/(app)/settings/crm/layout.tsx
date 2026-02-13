/**
 * CRM Settings Layout
 *
 * Provides:
 * - Back navigation to Settings
 *
 * @module app/[locale]/(app)/settings/crm/layout
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CrmSettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CrmSettingsLayout({
  children,
  params,
}: CrmSettingsLayoutProps) {
  const { locale } = await params;

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-3">
          {/* Back Button */}
          <Link
            href={`/${locale}/settings`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Settings</span>
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
