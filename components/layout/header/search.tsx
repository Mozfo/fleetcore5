"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CommandIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHasPermission } from "@/lib/hooks/useHasPermission";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import type { ModuleConfig } from "@/lib/config/modules";

export default function Search() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("common");
  const { accessibleModules } = useHasPermission();
  const { localizedPath } = useLocalizedPath();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Group modules by their group field, merging same-named groups
  const groups = useMemo(() => {
    const map = new Map<string, ModuleConfig[]>();
    for (const mod of accessibleModules) {
      const key = mod.group ?? t("navigation.general", "General");
      const existing = map.get(key);
      if (existing) {
        existing.push(mod);
      } else {
        map.set(key, [mod]);
      }
    }
    return Array.from(map.entries()).map(([title, items]) => ({
      title,
      items,
    }));
  }, [accessibleModules, t]);

  return (
    <div className="lg:flex-1" suppressHydrationWarning>
      <div className="relative hidden max-w-sm flex-1 lg:block">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
          placeholder={t("navigation.search", "Search...")}
          type="search"
          onFocus={() => setOpen(true)}
        />
        <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
          <CommandIcon className="size-3" />
          <span>k</span>
        </div>
      </div>
      <div className="block lg:hidden">
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
          <SearchIcon />
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
        </VisuallyHidden>
        <CommandInput
          placeholder={t(
            "navigation.search_command",
            "Type a command or search..."
          )}
        />
        <CommandList>
          <CommandEmpty>
            {t("navigation.no_results", "No results found.")}
          </CommandEmpty>
          {groups.map((group) => (
            <React.Fragment key={group.title}>
              <CommandGroup heading={group.title}>
                {group.items.map((mod) => (
                  <CommandItem
                    key={mod.key}
                    onSelect={() => {
                      setOpen(false);
                      router.push(localizedPath(mod.href.slice(1)));
                    }}
                  >
                    {mod.icon && <mod.icon />}
                    <span>{t(mod.labelKey)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
