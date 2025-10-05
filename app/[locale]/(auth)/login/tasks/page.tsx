"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { useOrganizationList, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function LoginTasksContent() {
  const { localizedPath } = useLocalizedPath();
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const { setActive } = useClerk();
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Wait for data to load
    if (!isLoaded || hasProcessed.current) return;

    const memberships = userMemberships?.data;

    // If user has exactly one organization, auto-select it
    if (memberships && memberships.length === 1) {
      hasProcessed.current = true;
      const organization = memberships[0].organization;

      setActive({ organization: organization.id })
        .then(() => {
          router.push(localizedPath("dashboard"));
        })
        .catch(() => {
          // Even if setActive fails, try redirecting
          router.push(localizedPath("dashboard"));
        });
    } else if (memberships && memberships.length === 0) {
      // No organization - this shouldn't happen with invitation workflow
      // Redirect to dashboard anyway and let auth handle it
      hasProcessed.current = true;
      router.push(localizedPath("dashboard"));
    } else if (memberships && memberships.length > 1) {
      // Multiple organizations - auto-select first one (or could show selector)
      hasProcessed.current = true;
      const organization = memberships[0].organization;

      setActive({ organization: organization.id })
        .then(() => {
          router.push(localizedPath("dashboard"));
        })
        .catch(() => {
          router.push(localizedPath("dashboard"));
        });
    }
  }, [isLoaded, userMemberships, setActive, router, localizedPath]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-gray-900">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Setting up your workspace...
          </h2>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginTasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginTasksContent />
    </Suspense>
  );
}
