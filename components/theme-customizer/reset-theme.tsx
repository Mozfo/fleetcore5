"use client";

import { useThemeConfig } from "@/components/active-theme";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { DEFAULT_THEME } from "@/lib/themes";

export function ResetThemeButton() {
  const { setTheme } = useThemeConfig();
  const { setOpen } = useSidebar();

  const resetThemeHandle = () => {
    setTheme(DEFAULT_THEME);
    setOpen(true);
  };

  return (
    <Button className="mt-4 w-full" onClick={resetThemeHandle}>
      Reset to Default
    </Button>
  );
}
