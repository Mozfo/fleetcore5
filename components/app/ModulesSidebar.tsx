"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronsLeft } from "lucide-react";
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Timing constants (Linear-style UX)
const HOVER_OPEN_DELAY = 150;
const HOVER_CLOSE_DELAY = 300;

/**
 * ModulesSidebar - FleetCore Design System navigation sidebar
 *
 * Collapsible: 56px (icons only) ↔ 240px (icons + labels)
 * Active state: bg-fc-primary-50 text-fc-primary-600
 * Hover expand for sub-navigation (Linear-style 150ms/300ms)
 */
export function ModulesSidebar({
  className,
  isExpanded = true,
  onToggleExpand,
}: ModulesSidebarProps) {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { localizedPath } = useLocalizedPath();
  const { accessibleModules, orgRole } = useHasPermission();
  const { opportunitiesEnabled, quotesEnabled } = useCrmFeatureFlags();

  // Track expanded modules (sub-nav open/close)
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

  // Handle mouse enter with delay (Linear-style) — only when sidebar expanded
  const handleMouseEnter = useCallback(
    (moduleKey: string, hasSubNav: boolean) => {
      if (!hasSubNav || !isExpanded) return;

      const existingTimeout = hoverTimeoutRefs.current[moduleKey];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        hoverTimeoutRefs.current[moduleKey] = null;
      }

      hoverTimeoutRefs.current[moduleKey] = setTimeout(() => {
        expandModule(moduleKey);
      }, HOVER_OPEN_DELAY);
    },
    [expandModule, isExpanded]
  );

  // Handle mouse leave with delay
  const handleMouseLeave = useCallback(
    (moduleKey: string, hasSubNav: boolean) => {
      if (!hasSubNav || !isExpanded) return;

      const existingOpenTimeout = hoverTimeoutRefs.current[moduleKey];
      if (existingOpenTimeout) {
        clearTimeout(existingOpenTimeout);
        hoverTimeoutRefs.current[moduleKey] = null;
      }

      hoverTimeoutRefs.current[moduleKey] = setTimeout(() => {
        collapseModule(moduleKey);
      }, HOVER_CLOSE_DELAY);
    },
    [collapseModule, isExpanded]
  );

  const isModuleActive = (module: ModuleConfig): boolean => {
    const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "");

    if (pathWithoutLocale.startsWith(module.href)) {
      return true;
    }

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
        "border-fc-border-light flex h-full flex-col border-r bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-900",
        isExpanded ? "w-60" : "w-14",
        className
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className={cn("space-y-0.5", isExpanded ? "px-3" : "px-1.5")}>
          {accessibleModules.map((module, index) => {
            const isActive = isModuleActive(module);
            const isModuleExpanded = expandedModules.includes(module.key);
            const hasSubNav = module.subNav && module.subNav.length > 0;
            const Icon = module.icon;

            // Show group header when group changes
            const prevModule = index > 0 ? accessibleModules[index - 1] : null;
            const showGroupHeader =
              isExpanded && module.group && module.group !== prevModule?.group;

            return (
              <li
                key={module.key}
                onMouseEnter={() => handleMouseEnter(module.key, !!hasSubNav)}
                onMouseLeave={() => handleMouseLeave(module.key, !!hasSubNav)}
              >
                {/* Section header */}
                {showGroupHeader && (
                  <div
                    className={cn(
                      "text-fc-text-muted px-3 text-[10px] font-bold tracking-widest uppercase dark:text-gray-500",
                      index > 0 ? "mt-4 mb-2" : "mb-2"
                    )}
                  >
                    {module.group}
                  </div>
                )}

                {/* Module item */}
                <div
                  className={cn(
                    "group flex h-10 items-center transition-colors duration-150",
                    isExpanded ? "justify-between px-3" : "justify-center",
                    isActive
                      ? "rounded-fc-md border-fc-primary-500 bg-fc-primary-50 text-fc-primary-600 border-l-[3px] dark:bg-blue-900/20 dark:text-blue-400"
                      : "rounded-fc-md text-fc-text-secondary hover:bg-fc-bg-hover hover:text-fc-text-primary dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Link
                    href={localizedPath(module.href.slice(1))}
                    className={cn(
                      "flex items-center gap-3",
                      isExpanded ? "flex-1" : "justify-center"
                    )}
                    title={!isExpanded ? t(module.labelKey) : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="truncate text-sm font-medium">
                          {t(module.labelKey)}
                        </span>
                        {module.badge && (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                              module.badge === "new"
                                ? "bg-fc-success-50 text-fc-success-600 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            )}
                          >
                            {module.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Expand/collapse chevron for modules with subNav */}
                  {hasSubNav && isExpanded && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleModule(module.key);
                      }}
                      className="hover:bg-fc-bg-hover ml-1 rounded p-1 opacity-60 transition-opacity hover:opacity-100 dark:hover:bg-gray-700"
                      aria-label={isModuleExpanded ? "Collapse" : "Expand"}
                    >
                      <motion.div
                        animate={{ rotate: isModuleExpanded ? 90 : 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </button>
                  )}
                </div>

                {/* Sub-navigation with smooth animation (only when sidebar expanded) */}
                <AnimatePresence initial={false}>
                  {hasSubNav && isModuleExpanded && isExpanded && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        },
                        opacity: { duration: 0.15 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="border-fc-border-light mt-1 ml-4 space-y-0.5 border-l-2 pl-4 dark:border-gray-700">
                        {module.subNav?.map((subNav, index) => {
                          // Check permission for subNav item
                          if (
                            subNav.permission &&
                            !hasPermission(orgRole, subNav.permission)
                          ) {
                            return null;
                          }

                          // V6.2-11: Hide Opportunities and Quotes based on feature flags
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
                                  "rounded-fc-md block px-3 py-1.5 text-sm transition-colors duration-150",
                                  isSubActive
                                    ? "bg-fc-primary-50 text-fc-primary-600 font-medium dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-fc-text-muted hover:bg-fc-bg-hover hover:text-fc-text-primary dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200"
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

      {/* Footer: Collapse toggle + version */}
      <div className="border-fc-border-light border-t dark:border-gray-800">
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="hover:bg-fc-bg-hover flex h-10 w-full items-center justify-center transition-colors duration-150 dark:hover:bg-gray-800"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronsLeft
              className={cn(
                "text-fc-text-muted h-4 w-4 transition-transform duration-150",
                !isExpanded && "rotate-180"
              )}
            />
          </button>
        )}
        {isExpanded && (
          <div className="px-4 pt-1 pb-3">
            <p className="text-fc-text-muted text-xs dark:text-gray-400">
              FleetCore v1.0
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
