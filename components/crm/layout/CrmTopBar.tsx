/**
 * CrmTopBar - Premium header bar for CRM layout
 * Minimal design with notifications and user menu
 */

"use client";

import { Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface CrmTopBarProps {
  afterSignOutUrl: string;
}

export function CrmTopBar({ afterSignOutUrl }: CrmTopBarProps) {
  return (
    <div className="flex h-14 items-center justify-end px-6">
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <UserButton afterSignOutUrl={afterSignOutUrl} />
      </div>
    </div>
  );
}
