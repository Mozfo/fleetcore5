import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const user = await currentUser();
  const { locale } = await params;

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <Toaster position="top-right" richColors />
    </>
  );
}
