"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Mail, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  {
    title: "Users",
    href: "/adm/settings/users",
    icon: Users,
  },
  {
    title: "Organizations",
    href: "/adm/settings/organizations",
    icon: Building2,
  },
  {
    title: "Invitations",
    href: "/adm/settings/invitations",
    icon: Mail,
  },
];

export function SettingsSidebarNav() {
  const pathname = usePathname();

  return (
    <Card className="py-0">
      <CardContent className="p-2">
        <nav className="flex flex-col space-y-0.5">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "hover:bg-muted justify-start",
                pathname.startsWith(item.href) ? "bg-muted hover:bg-muted" : ""
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 size-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
