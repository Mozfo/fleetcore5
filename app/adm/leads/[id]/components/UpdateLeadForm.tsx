"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

type Lead = {
  id: string;
  status: string | null;
  assigned_to: string | null;
};

interface UpdateLeadFormProps {
  lead: Lead;
}

export default function UpdateLeadForm({ lead }: UpdateLeadFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(lead.status || "new"); // V6.3: default to "new"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/demo-leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (_error) {
      // Error handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Update Lead Status
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status *
          </label>
          {/* V6.3: 8 statuts */}
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="new">New</option>
            <option value="demo">Demo</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="payment_pending">Payment Pending</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
            <option value="nurturing">Nurturing</option>
            <option value="disqualified">Disqualified</option>
          </Select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isSubmitting ? "Updating..." : "Update Status"}
        </button>
      </form>
    </div>
  );
}
