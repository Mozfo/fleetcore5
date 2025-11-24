/**
 * CRM Layout - Layout pour le module CRM commercial
 * Route group (crm) pour isolation du module
 * Sidebar avec navigation CRM (Leads, Opportunities, Contracts, etc.)
 */

import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Users, Car } from "lucide-react";
import { localizedRedirect, getLocalizedPath } from "@/lib/navigation";
import type { ReactNode } from "react";

interface CRMLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CRMLayout({ children, params }: CRMLayoutProps) {
  const user = await currentUser();
  const { locale } = await params;

  if (!user) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar CRM */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          <Link
            href={getLocalizedPath("/", locale as "en" | "fr")}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-lg font-bold text-transparent">
              FleetCore
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href={getLocalizedPath("/crm/leads", locale as "en" | "fr")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Users className="h-5 w-5" />
            Leads
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-16 items-center justify-end px-6">
            <UserButton
              afterSignOutUrl={getLocalizedPath("/", locale as "en" | "fr")}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
