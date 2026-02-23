"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResetPasswordDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  userId,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleReset() {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/adm/settings/users/${userId}/reset-password`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to reset password");
        return;
      }
      toast.success(`Password reset. Temporary: ${json.tempPassword}`, {
        duration: 15000,
      });
      onOpenChange(false);
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password</AlertDialogTitle>
          <AlertDialogDescription>
            This will generate a temporary password. Share it securely with the
            user. The user should change it on their next login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
