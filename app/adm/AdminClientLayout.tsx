"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Building2, Settings } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth protection is handled by the server layout (app/adm/layout.tsx)

  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/adm",
      icon: LayoutDashboard,
      current: pathname === "/adm",
    },
    {
      name: "Leads",
      href: "/adm/leads",
      icon: Users,
      current: pathname.startsWith("/adm/leads"),
    },
    {
      name: "Organizations",
      href: "/adm/organizations",
      icon: Building2,
      current: pathname.startsWith("/adm/organizations"),
    },
    {
      name: "Settings",
      href: "/adm/settings",
      icon: Settings,
      current: pathname.startsWith("/adm/settings"),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            FleetCore Admin
          </h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Admin Backoffice
            </h2>
            <UserMenu afterSignOutUrl="/en" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
