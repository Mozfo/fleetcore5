import type { Metadata } from "next";
import { cookies } from "next/headers";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { fontVariables } from "@/lib/fonts";
import { ActiveThemeProvider } from "@/components/active-theme";
import { DEFAULT_THEME } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetCore",
  description: "Fleet Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeSettings = {
    preset: (cookieStore.get("theme_preset")?.value ??
      DEFAULT_THEME.preset) as typeof DEFAULT_THEME.preset,
    scale: (cookieStore.get("theme_scale")?.value ??
      DEFAULT_THEME.scale) as typeof DEFAULT_THEME.scale,
    radius: (cookieStore.get("theme_radius")?.value ??
      DEFAULT_THEME.radius) as typeof DEFAULT_THEME.radius,
    contentLayout: (cookieStore.get("theme_content_layout")?.value ??
      DEFAULT_THEME.contentLayout) as typeof DEFAULT_THEME.contentLayout,
  };

  const defaultValues: Record<string, string> = {
    preset: DEFAULT_THEME.preset,
    scale: DEFAULT_THEME.scale,
    radius: DEFAULT_THEME.radius,
  };

  const bodyAttributes = Object.fromEntries(
    Object.entries(themeSettings)
      .filter(([key, value]) => value && value !== defaultValues[key])
      .map(([key, value]) => [
        `data-theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
        value,
      ])
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "bg-background group/layout font-sans antialiased",
          fontVariables
        )}
        {...bodyAttributes}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ActiveThemeProvider initialTheme={themeSettings}>
            <ClerkProvider>{children}</ClerkProvider>
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
