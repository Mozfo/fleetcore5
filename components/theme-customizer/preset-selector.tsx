"use client";

import { DEFAULT_THEME, THEMES, type ThemeType } from "@/lib/themes";
import { useThemeConfig } from "@/components/active-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function PresetSelector() {
  const { theme, setTheme } = useThemeConfig();

  const handlePreset = (value: string) => {
    setTheme({ ...theme, ...DEFAULT_THEME, preset: value } as ThemeType);
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>Theme preset:</Label>
      <Select
        value={theme.preset}
        onValueChange={(value) => handlePreset(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent align="end">
          {THEMES.map((t) => (
            <SelectItem key={t.name} value={t.value}>
              <div className="flex shrink-0 gap-1">
                {t.colors.map((color, key) => (
                  <span
                    key={key}
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  ></span>
                ))}
              </div>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
