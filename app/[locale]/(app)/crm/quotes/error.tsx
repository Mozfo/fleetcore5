"use client";

/**
 * Error boundary for Quotes page
 * Handles runtime errors gracefully
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface QuotesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function QuotesError({ error, reset }: QuotesErrorProps) {
  const { t } = useTranslation("crm");

  useEffect(() => {
    // Log error to monitoring service
    logger.error({ error }, "[QuotesPage] Error");
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
          {t("quotes.error.title", "Something went wrong")}
        </h2>
        <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
          {t(
            "quotes.error.description",
            "We encountered an error while loading the quotes. Please try again."
          )}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("quotes.error.retry", "Try again")}
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/crm")}
          >
            {t("quotes.error.back", "Back to CRM")}
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-500">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
