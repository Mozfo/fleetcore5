import { prisma } from "@/lib/prisma";
import RequestDemoForm from "./request-demo-form";

export default async function RequestDemoFormPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Next.js 15: params is now a Promise
  const { locale } = await params;

  // Fetch countries server-side (instant, no loading)
  const countries = await prisma.crm_countries.findMany({
    where: { is_visible: true },
    orderBy: { display_order: "asc" },
    select: {
      id: true,
      country_code: true,
      country_name_en: true,
      country_name_fr: true,
      country_name_ar: true,
      flag_emoji: true,
      is_operational: true,
      display_order: true,
    },
  });

  return <RequestDemoForm countries={countries} locale={locale} />;
}
