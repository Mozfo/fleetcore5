import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { localizedRedirect, getLocalizedPath } from "@/lib/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const user = await currentUser();
  const { locale } = await params;

  if (!user) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            FleetCore
          </h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href={getLocalizedPath("dashboard", locale as "en" | "fr")}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.emailAddresses?.[0]?.emailAddress ||
                user?.firstName ||
                "User"}
            </h2>
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
