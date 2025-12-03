/**
 * Lead Not Found Page
 */

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <FileQuestion className="h-10 w-10 text-gray-400" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
          Lead Not Found
        </h1>
        <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
          The lead you&apos;re looking for doesn&apos;t exist or has been
          deleted. It may have been removed or the link might be incorrect.
        </p>

        <Button asChild>
          <Link href="/crm/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
        </Button>
      </div>
    </div>
  );
}
