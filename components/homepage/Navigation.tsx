"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { Car, Globe, ChevronRight } from "lucide-react";

export function Navigation() {
  const { locale, localizedPath } = useLocalizedPath();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation("common");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fleet");
  const [activeSolutionTab, setActiveSolutionTab] =
    useState<string>("industry");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-xl font-bold text-transparent">
                FleetCore
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 lg:flex">
            {/* Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown("product")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 py-4 font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                {t("homepage.nav.product")}
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>

              {openDropdown === "product" && (
                <div className="fixed top-16 right-0 left-0 z-50 border-b border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
                  <div className="mx-auto flex max-w-7xl">
                    <div className="w-64 border-r border-gray-200 py-6 dark:border-gray-700">
                      <div className="space-y-1">
                        <button
                          onMouseEnter={() => setActiveTab("fleet")}
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeTab === "fleet" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.productMenu.tabs.fleet")}
                        </button>
                        <button
                          onMouseEnter={() => setActiveTab("platform")}
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeTab === "platform" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.productMenu.tabs.platform")}
                        </button>
                        <button
                          onMouseEnter={() => setActiveTab("analytics")}
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeTab === "analytics" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.productMenu.tabs.analytics")}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      {activeTab === "fleet" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.productMenu.fleet.items.0.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.productMenu.fleet.items.0.desc")}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.productMenu.fleet.items.1.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.productMenu.fleet.items.1.desc")}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.productMenu.fleet.items.2.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.productMenu.fleet.items.2.desc")}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.productMenu.fleet.items.3.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.productMenu.fleet.items.3.desc")}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.productMenu.fleet.items.4.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.productMenu.fleet.items.4.desc")}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.productMenu.fleet.items.5.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.productMenu.fleet.items.5.desc")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === "platform" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.platform.items.0.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.platform.items.0.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.platform.items.1.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.platform.items.1.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.platform.items.2.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.platform.items.2.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.platform.items.3.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.platform.items.3.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.platform.items.4.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.platform.items.4.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.platform.items.5.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.platform.items.5.desc"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeTab === "analytics" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.analytics.items.0.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.analytics.items.0.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.analytics.items.1.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.analytics.items.1.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.analytics.items.2.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.analytics.items.2.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.analytics.items.3.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.analytics.items.3.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.analytics.items.4.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.analytics.items.4.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.productMenu.analytics.items.5.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.productMenu.analytics.items.5.desc"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown("solutions")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 py-4 font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                {t("homepage.nav.solutions")}
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
              {openDropdown === "solutions" && (
                <div className="fixed top-16 right-0 left-0 z-50 border-b border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
                  <div className="mx-auto flex max-w-7xl">
                    <div className="w-64 border-r border-gray-200 py-6 dark:border-gray-700">
                      <div className="space-y-1">
                        <button
                          onMouseEnter={() => setActiveSolutionTab("industry")}
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeSolutionTab === "industry" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.solutionsMenu.tabs.industry")}
                        </button>
                        <button
                          onMouseEnter={() => setActiveSolutionTab("size")}
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeSolutionTab === "size" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.solutionsMenu.tabs.size")}
                        </button>
                        <button
                          onMouseEnter={() => setActiveSolutionTab("usecase")}
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeSolutionTab === "usecase" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.solutionsMenu.tabs.usecase")}
                        </button>
                        <button
                          onMouseEnter={() =>
                            setActiveSolutionTab("compliance")
                          }
                          className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeSolutionTab === "compliance" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                        >
                          {t("homepage.solutionsMenu.tabs.compliance")}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      {activeSolutionTab === "industry" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.industry.items.0.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.industry.items.0.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.industry.items.1.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.industry.items.1.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.industry.items.2.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.industry.items.2.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.industry.items.3.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.industry.items.3.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.industry.items.4.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.industry.items.4.desc"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeSolutionTab === "size" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.solutionsMenu.size.items.0.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.solutionsMenu.size.items.0.desc")}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.solutionsMenu.size.items.1.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.solutionsMenu.size.items.1.desc")}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.solutionsMenu.size.items.2.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.solutionsMenu.size.items.2.desc")}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.solutionsMenu.size.items.3.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.solutionsMenu.size.items.3.desc")}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.solutionsMenu.size.items.4.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.solutionsMenu.size.items.4.desc")}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t("homepage.solutionsMenu.size.items.5.title")}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("homepage.solutionsMenu.size.items.5.desc")}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeSolutionTab === "usecase" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.0.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.0.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.1.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.1.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.2.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.2.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.3.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.3.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.4.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.4.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.5.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.usecase.items.5.desc"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {activeSolutionTab === "compliance" && (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.0.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.0.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.1.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.1.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.2.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.2.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.3.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.3.desc"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.4.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.4.desc"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.5.title"
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                  "homepage.solutionsMenu.compliance.items.5.desc"
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Regular Links */}
            <Link
              href={`/${locale}/resources`}
              className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {t("homepage.nav.resources")}
            </Link>
            <Link
              href={`/${locale}/company`}
              className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {t("homepage.nav.company")}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden rounded-lg p-2 transition hover:bg-gray-100 lg:block dark:hover:bg-gray-800"
            >
              {!mounted ? "⚪" : theme === "dark" ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => router.push(locale === "en" ? "/fr" : "/en")}
              className="hidden items-center gap-2 text-gray-600 hover:text-gray-900 lg:flex dark:text-gray-400 dark:hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {locale === "en" ? "FR" : "EN"}
            </button>

            <Link
              href={localizedPath("login")}
              className="hidden font-medium text-gray-700 hover:text-gray-900 lg:inline-block dark:text-gray-300 dark:hover:text-white"
            >
              {t("homepage.nav.login")}
            </Link>

            <Link
              href={localizedPath("request-demo")}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-700 px-5 py-2.5 font-semibold text-white transition-all hover:shadow-lg"
            >
              {t("homepage.nav.demo")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
