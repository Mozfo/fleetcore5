"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarModeSelector() {
  const { open, setOpen } = useSidebar();

  return (
    <div className="hidden flex-col gap-4 lg:flex">
      <Label>Sidebar mode:</Label>
      <ToggleGroup
        value={open ? "default" : "icon"}
        type="single"
        onValueChange={(value) => {
          if (value === "default") setOpen(true);
          if (value === "icon") setOpen(false);
        }}
        className="*:border-input w-full gap-4 *:rounded-md *:border"
      >
        <ToggleGroupItem variant="outline" value="default">
          Default
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="icon"
          className="data-[variant=outline]:border-l-1"
        >
          Icon
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
