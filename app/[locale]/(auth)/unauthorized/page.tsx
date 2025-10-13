"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  useTranslation("auth"); // Load auth translations
  const { localizedPath } = useLocalizedPath();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="rounded-3xl bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-gray-900">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
          >
            <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
          </motion.div>

          {/* Title */}
          <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
            403 - Unauthorized
          </h1>

          {/* Description */}
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access this resource. Please
            contact your administrator if you believe this is an error.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link href={localizedPath("dashboard")}>
              <Button className="h-12 w-full rounded-xl bg-gray-900 font-medium text-white hover:bg-[#2D4739] dark:bg-gray-700">
                Return to Dashboard
              </Button>
            </Link>
            <Link
              href={localizedPath("/")}
              className="block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
