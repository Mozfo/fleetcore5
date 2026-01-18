"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/lib/hooks/useHasPermission";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import {
  getModuleByPath,
  type ModuleConfig,
  type SubNavItem,
} from "@/lib/config/modules";
import { hasPermission } from "@/lib/config/permissions";
import { useCrmFeatureFlags } from "@/lib/hooks/useCrmFeatureFlags";

interface ModulesSidebarProps {
  className?: string;
}

// Timing constants (Linear-style UX)
const HOVER_OPEN_DELAY = 150; // ms before opening on hover
const HOVER_CLOSE_DELAY = 300; // ms before closing when leaving

export function ModulesSidebar({ className }: ModulesSidebarProps) {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { localizedPath } = useLocalizedPath();
  const { accessibleModules, orgRole } = useHasPermission();
  const { opportunitiesEnabled, quotesEnabled } = useCrmFeatureFlags();

  // Track expanded modules
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    const currentModule = getModuleByPath(pathname);
    return currentModule ? [currentModule.key] : [];
  });

  // Hover timeout refs for each module
  const hoverTimeoutRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  const expandModule = useCallback((moduleKey: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleKey) ? prev : [...prev, moduleKey]
    );
  }, []);

  const collapseModule = useCallback(
    (moduleKey: string) => {
      // Don't collapse if it's the active module
      const currentModule = getModuleByPath(pathname);
      if (currentModule?.key === moduleKey) return;

      setExpandedModules((prev) => prev.filter((k) => k !== moduleKey));
    },
    [pathname]
  );

  const toggleModule = useCallback((moduleKey: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    );
  }, []);

  // Handle mouse enter with delay (Linear-style)
  const handleMouseEnter = useCallback(
    (moduleKey: string, hasSubNav: boolean) => {
      if (!hasSubNav) return;

      // Clear any pending close timeout
      const existingTimeout = hoverTimeoutRefs.current[moduleKey];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        hoverTimeoutRefs.current[moduleKey] = null;
      }

      // Set open timeout
      hoverTimeoutRefs.current[moduleKey] = setTimeout(() => {
        expandModule(moduleKey);
      }, HOVER_OPEN_DELAY);
    },
    [expandModule]
  );

  // Handle mouse leave with delay
  const handleMouseLeave = useCallback(
    (moduleKey: string, hasSubNav: boolean) => {
      if (!hasSubNav) return;

      // Clear any pending open timeout
      const existingOpenTimeout = hoverTimeoutRefs.current[moduleKey];
      if (existingOpenTimeout) {
        clearTimeout(existingOpenTimeout);
        hoverTimeoutRefs.current[moduleKey] = null;
      }

      // Set close timeout
      hoverTimeoutRefs.current[moduleKey] = setTimeout(() => {
        collapseModule(moduleKey);
      }, HOVER_CLOSE_DELAY);
    },
    [collapseModule]
  );

  const isModuleActive = (module: ModuleConfig): boolean => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");

    // Check main module href
    if (pathWithoutLocale.startsWith(module.href)) {
      return true;
    }

    // Also check subNav items (e.g., /crm/opportunities is part of CRM module)
    if (module.subNav) {
      for (const sub of module.subNav) {
        if (pathWithoutLocale.startsWith(sub.href)) {
          return true;
        }
      }
    }

    return false;
  };

  const isSubNavActive = (subNav: SubNavItem): boolean => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");
    return pathWithoutLocale === subNav.href;
  };

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <Link
          href={localizedPath("dashboard")}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-700">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            FleetCore
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {accessibleModules.map((module) => {
            const isActive = isModuleActive(module);
            const isExpanded = expandedModules.includes(module.key);
            const hasSubNav = module.subNav && module.subNav.length > 0;
            const Icon = module.icon;

            return (
              <li
                key={module.key}
                onMouseEnter={() => handleMouseEnter(module.key, !!hasSubNav)}
                onMouseLeave={() => handleMouseLeave(module.key, !!hasSubNav)}
              >
                {/* Module item */}
                <div
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Link
                    href={localizedPath(module.href.slice(1))}
                    className="flex flex-1 items-center gap-3"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{t(module.labelKey)}</span>
                    {module.badge && (
                      <span
                        className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                          module.badge === "new"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        )}
                      >
                        {module.badge}
                      </span>
                    )}
                  </Link>

                  {/* Expand/collapse chevron for modules with subNav */}
                  {hasSubNav && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleModule(module.key);
                      }}
                      className="ml-2 rounded p-1 opacity-60 transition-opacity hover:bg-gray-200 hover:opacity-100 dark:hover:bg-gray-700"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </button>
                  )}
                </div>

                {/* Sub-navigation with smooth animation */}
                <AnimatePresence initial={false}>
                  {hasSubNav && isExpanded && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { type: "spring", stiffness: 400, damping: 25 },
                        opacity: { duration: 0.15 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                        {module.subNav?.map((subNav, index) => {
                          // Check permission for subNav item
                          if (
                            subNav.permission &&
                            !hasPermission(orgRole, subNav.permission)
                          ) {
                            return null;
                          }

                          // V6.2-11: Hide Opportunities and Quotes based on feature flags
                          // Opportunities = FREEZE (future upsell for existing customers)
                          // Quotes = INLINE in Lead detail (Segment 4 only)
                          if (
                            module.key === "crm" &&
                            subNav.key === "opportunities" &&
                            !opportunitiesEnabled
                          ) {
                            return null;
                          }
                          if (
                            module.key === "crm" &&
                            subNav.key === "quotes" &&
                            !quotesEnabled
                          ) {
                            return null;
                          }

                          const isSubActive = isSubNavActive(subNav);

                          return (
                            <motion.li
                              key={subNav.key}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: index * 0.03,
                                duration: 0.15,
                              }}
                            >
                              <Link
                                href={localizedPath(subNav.href.slice(1))}
                                className={cn(
                                  "block rounded-md px-3 py-1.5 text-sm transition-all duration-150",
                                  isSubActive
                                    ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
                                )}
                              >
                                {t(subNav.labelKey)}
                              </Link>
                            </motion.li>
                          );
                        })}
                      </div>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          FleetCore v1.0
        </p>
      </div>
    </aside>
  );
}
