"use client";

/**
 * UserMenu — custom user menu dropdown.
 *
 * Displays avatar (or initials fallback), name, email, and sign-out action.
 * Uses Better Auth client wrapper (lib/auth/client).
 *
 * @module components/layout/UserMenu
 */

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useAuth } from "@/lib/auth/client";

interface UserMenuProps {
  /** URL to redirect after sign-out (default: "/") */
  afterSignOutUrl?: string;
}

export function UserMenu({ afterSignOutUrl = "/" }: UserMenuProps) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "User"
    : "User";

  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase() || "U"
    : "U";

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const handleSignOut = async () => {
    await signOut();
    router.push(afterSignOutUrl);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={user?.imageUrl} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="text-muted-foreground truncate text-xs">
                {email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
