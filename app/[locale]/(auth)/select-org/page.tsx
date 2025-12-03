"use client";

import { useEffect, Suspense } from "react";
import { useOrganizationList, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Organization Selection Page
 *
 * Official Clerk best practice for B2B apps:
 * https://clerk.com/docs/organizations/force-organizations
 *
 * After login, Clerk does NOT auto-activate an organization.
 * This page handles organization selection/activation before
 * redirecting to protected routes.
 */
function SelectOrgContent() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/en/dashboard";

  const { setActive, userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  // Hook pour forcer le refresh du JWT après activation de l'org
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const memberships = userMemberships.data;

    // Auto-select if user has exactly one organization
    if (memberships && memberships.length === 1) {
      const org = memberships[0].organization;
      void setActive({ organization: org.id }).then(async () => {
        // Force le refresh du JWT pour inclure orgId (pattern Clerk 2025)
        await getToken({ skipCache: true });
        router.push(redirectUrl);
      });
    }
  }, [
    isLoaded,
    userMemberships.data,
    setActive,
    router,
    redirectUrl,
    getToken,
  ]);

  // Loading state
  if (!isLoaded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center"
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t("selectOrg.loading", "Loading your organizations...")}
        </p>
      </motion.div>
    );
  }

  const memberships = userMemberships.data || [];

  // No organizations - show error
  if (memberships.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md"
      >
        <div className="rounded-3xl bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-gray-900">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20">
              <Building2 className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
            {t("selectOrg.noOrg.title", "No Organization Found")}
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t(
              "selectOrg.noOrg.description",
              "Your account is not associated with any organization. Please contact your administrator."
            )}
          </p>
          <Button
            onClick={() => router.push("/en/login")}
            className="w-full"
            variant="outline"
          >
            {t("selectOrg.noOrg.backToLogin", "Back to Login")}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Single organization - show loading while auto-selecting
  if (memberships.length === 1) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center"
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t("selectOrg.activating", "Activating your organization...")}
        </p>
      </motion.div>
    );
  }

  // Multiple organizations - show selection UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-3xl bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-gray-900">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </motion.div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {t("selectOrg.title", "Select Organization")}
          </h1>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {t("selectOrg.subtitle", "Choose which organization to access")}
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((membership, index) => (
            <motion.button
              key={membership.organization.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={async () => {
                await setActive({ organization: membership.organization.id });
                await getToken({ skipCache: true });
                router.push(redirectUrl);
              }}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-600 hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-700">
                <span className="text-lg font-bold text-white">
                  {membership.organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {membership.organization.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {membership.role === "org:admin"
                    ? t("selectOrg.roleAdmin", "Administrator")
                    : t("selectOrg.roleMember", "Member")}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SelectOrgPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SelectOrgContent />
    </Suspense>
  );
}
