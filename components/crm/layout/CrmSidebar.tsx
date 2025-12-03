/**
 * CrmSidebar - Sidebar navigation for CRM module
 * Features expandable menu sections with smooth animations
 *
 * Two independent sections:
 * - Pipeline: Kanban board for sales workflow (daily tool for sales team)
 * - Reports: BI dashboard for managers (search, KPIs, export, cold leads)
 *
 * FIX 27/11: Remplacé buttons+router.push par Link pour navigation fiable
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Car,
  Users,
  ChevronDown,
  LayoutGrid,
  BarChart3,
  Search,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// Key for storing last viewed lead ID
const LAST_VIEWED_LEAD_KEY = "crm-last-viewed-lead";

interface CrmSidebarProps {
  locale: "en" | "fr";
}

export function CrmSidebar({ locale }: CrmSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation("crm");
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["crm"]);
  const [, setLastViewedLeadId] = useState<string | null>(null);

  // Load last viewed lead ID from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_VIEWED_LEAD_KEY);
      if (stored) {
        setLastViewedLeadId(stored);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Track when user visits a lead detail page
  useEffect(() => {
    const leadDetailMatch = pathname.match(/\/crm\/leads\/([a-f0-9-]+)$/i);
    if (leadDetailMatch) {
      const leadId = leadDetailMatch[1];
      setLastViewedLeadId(leadId);
      try {
        localStorage.setItem(LAST_VIEWED_LEAD_KEY, leadId);
      } catch {
        // localStorage not available
      }
    }
  }, [pathname]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Link hrefs
  const leadsPipelineHref = `/${locale}/crm/leads`;
  const opportunitiesPipelineHref = `/${locale}/crm/opportunities`;
  const browserHref = `/${locale}/crm/leads/browser`;
  const reportsHref = `/${locale}/crm/leads/reports`;

  const isActiveLink = (id: string) => {
    if (id === "leads-pipeline") {
      // Leads Pipeline is active only on /crm/leads (kanban page)
      return pathname === `/${locale}/crm/leads`;
    }
    if (id === "opportunities-pipeline") {
      // Opportunities Pipeline is active on /crm/opportunities
      return pathname.startsWith(`/${locale}/crm/opportunities`);
    }
    if (id === "leads-browser") {
      // Browser is active on /crm/leads/browser
      return pathname === `/${locale}/crm/leads/browser`;
    }
    if (id === "leads-reports") {
      // Reports is active when on /crm/leads/reports OR individual lead detail
      const isReports = pathname === `/${locale}/crm/leads/reports`;
      const isLeadDetail =
        pathname.match(/\/crm\/leads\/[a-f0-9-]+$/i) !== null;
      return isReports || isLeadDetail;
    }
    return false;
  };

  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-gray-200 bg-white lg:flex lg:flex-col dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-lg font-bold text-transparent">
            FleetCore
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="mb-1">
          {/* CRM Menu - Expandable */}
          <button
            onClick={() => toggleMenu("crm")}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              expandedMenus.includes("crm")
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <span>CRM</span>
            </div>
            <motion.div
              animate={{ rotate: expandedMenus.includes("crm") ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>

          {/* Submenu - Using Link for reliable navigation */}
          {expandedMenus.includes("crm") && (
            <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
              {/* Leads Pipeline */}
              <Link
                href={leadsPipelineHref}
                prefetch={true}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActiveLink("leads-pipeline")
                    ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>{t("sidebar.leads_pipeline")}</span>
              </Link>

              {/* Opportunities Pipeline */}
              <Link
                href={opportunitiesPipelineHref}
                prefetch={true}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActiveLink("opportunities-pipeline")
                    ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                )}
              >
                <Target className="h-4 w-4" />
                <span>{t("sidebar.opportunities_pipeline")}</span>
              </Link>

              {/* Leads Browser - Search and detail split view */}
              <Link
                href={browserHref}
                prefetch={true}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActiveLink("leads-browser")
                    ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                )}
              >
                <Search className="h-4 w-4" />
                <span>{t("sidebar.leads_browser")}</span>
              </Link>

              {/* Leads Reports - BI dashboard for managers */}
              <Link
                href={reportsHref}
                prefetch={true}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActiveLink("leads-reports")
                    ? "bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                <span>{t("sidebar.leads_reports")}</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          FleetCore CRM v1.0
        </div>
      </div>
    </aside>
  );
}
