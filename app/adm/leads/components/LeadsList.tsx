"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Lead = {
  id: string;
  full_name: string;
  email: string;
  demo_company_name: string;
  fleet_size: string | null;
  country_code: string;
  status: string | null;
  created_at: Date | null;
};

interface LeadsListProps {
  leads: Lead[];
}

export default function LeadsList({ leads }: LeadsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", searchInput);
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<
      string,
      "pending" | "contacted" | "qualified" | "accepted" | "refused"
    > = {
      pending: "pending",
      contacted: "contacted",
      qualified: "qualified",
      accepted: "accepted",
      refused: "refused",
    };

    return (
      <Badge variant={statusMap[status || "pending"] || "default"}>
        {status || "pending"}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </form>

        <Select
          value={searchParams.get("status") || ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="accepted">Accepted</option>
          <option value="refused">Refused</option>
        </Select>

        <Select
          value={searchParams.get("country") || ""}
          onChange={(e) => updateFilter("country", e.target.value)}
          className="w-full sm:w-40"
        >
          <option value="">All Countries</option>
          <option value="AE">🇦🇪 UAE</option>
          <option value="FR">🇫🇷 France</option>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Fleet Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => router.push(`${pathname}/${lead.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {lead.full_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lead.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                      {lead.demo_company_name}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                      {lead.country_code === "AE" ? "🇦🇪 UAE" : "🇫🇷 France"}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                      {lead.fleet_size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
