import { redirect } from "next/navigation";
import { requireCrmAuth } from "@/lib/auth/server";
import AdminClientLayout from "./AdminClientLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireCrmAuth();
  } catch {
    redirect("/en/login");
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
