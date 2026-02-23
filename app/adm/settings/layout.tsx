import { SettingsSidebarNav } from "@/features/settings/components/settings-sidebar-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-4 lg:space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage users, organizations, and invitations.
        </p>
      </div>
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        <aside className="lg:w-56">
          <SettingsSidebarNav />
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
