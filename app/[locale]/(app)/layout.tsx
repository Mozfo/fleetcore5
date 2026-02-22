import { getCurrentUser } from "@/lib/auth/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { RefineProvider } from "@/components/providers/refine-provider";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const user = await getCurrentUser();
  const { locale } = await params;

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 14)",
            "--content-padding": "calc(var(--spacing) * 4)",
            "--content-margin": "calc(var(--spacing) * 1.5)",
            "--content-full-height":
              "calc(100vh - var(--header-height) - (var(--content-padding) * 2) - (var(--content-margin) * 2))",
          } as React.CSSProperties
        }
      >
        <RefineProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="bg-muted/40 flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col p-(--content-padding) xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
                {children}
              </div>
            </div>
          </SidebarInset>
        </RefineProvider>
      </SidebarProvider>
      <Toaster position="top-right" richColors />
    </>
  );
}
