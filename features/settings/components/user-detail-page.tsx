"use client";

import { ArrowLeft, Building2, KeyRound, Shield, User } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SettingsUser } from "../types/user.types";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface UserDetailPageProps {
  userId: string;
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
  const [user, setUser] = React.useState<SettingsUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [resetPwdOpen, setResetPwdOpen] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/adm/settings/users/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data: SettingsUser = await res.json();
        setUser(data);
      } catch {
        // Error handled by null state
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/adm/settings/users">
            <ArrowLeft className="mr-2 size-4" />
            Back to Users
          </Link>
        </Button>
        <p className="text-destructive">User not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/adm/settings/users">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h3 className="text-lg font-medium">{user.name}</h3>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetPwdOpen(true)}
        >
          <KeyRound className="mr-2 size-4" />
          Reset Password
        </Button>
      </div>

      {/* User info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Name
              </dt>
              <dd className="mt-1">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Email
              </dt>
              <dd className="mt-1">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Role
              </dt>
              <dd className="mt-1">
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                >
                  {user.role ?? "user"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Status
              </dt>
              <dd className="mt-1">
                <Badge variant={user.banned ? "destructive" : "success"}>
                  {user.banned ? "Banned" : "Active"}
                </Badge>
                {user.banReason && (
                  <span className="text-muted-foreground ml-2 text-sm">
                    ({user.banReason})
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Email Verified
              </dt>
              <dd className="mt-1">
                <Badge variant={user.emailVerified ? "success" : "warning"}>
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Created
              </dt>
              <dd className="mt-1">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Memberships card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Organization Memberships ({user.memberships.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.memberships.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No organization memberships.
            </p>
          ) : (
            <div className="space-y-3">
              {user.memberships.map((m) => (
                <div
                  key={m.organizationId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="text-muted-foreground size-4" />
                    <div>
                      <Link
                        href={`/adm/settings/organizations/${m.organizationId}`}
                        className="font-medium hover:underline"
                      >
                        {m.organizationName}
                      </Link>
                    </div>
                  </div>
                  <Badge variant="outline">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ResetPasswordDialog
        userId={userId}
        open={resetPwdOpen}
        onOpenChange={setResetPwdOpen}
      />
    </div>
  );
}
