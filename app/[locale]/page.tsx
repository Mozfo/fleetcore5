"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { FeatureItem, ProcessStep, ProofMetric } from "@/lib/i18n/types";
import {
  // Navigation & UI
  Car,
  Users,
  Globe,
  X,
  ChevronRight,
  ArrowRight,
  // Features
  CreditCard,
  FileSignature,
  Wrench,
  MapPin,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  // Platforms
  Activity,
  Database,
  Settings,
  Wifi,
  // Status
  Circle,
  CircleCheck,
  Gauge,
  Zap,
  // Process
  Phone,
  UserCheck,
  FileCheck,
  Briefcase,
  Rocket,
} from "lucide-react";

export default function FleetCoreUltimatePremium() {
  const { locale, localizedPath } = useLocalizedPath();
  const router = useRouter();
  const [dashboardView, setDashboardView] = useState<
    "operations" | "financial" | "maintenance"
  >("operations");
  const [fleetType, setFleetType] = useState<"rental" | "ridehailing">(
    "rental"
  );
  const { theme, setTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("rental");
  const [activeSolutionTab, setActiveSolutionTab] =
    useState<string>("industry");
  // Live metrics animation
  const [metrics, setMetrics] = useState({
    activeVehicles: 342,
    dailyRevenue: 48750,
    utilization: 78.5,
    activeBookings: 127,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        activeVehicles: 342 + Math.floor(Math.random() * 10 - 5),
        dailyRevenue: 48750 + Math.floor(Math.random() * 2000 - 1000),
        utilization: 78.5 + (Math.random() * 4 - 2),
        activeBookings: 127 + Math.floor(Math.random() * 20 - 10),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { t, ready } = useTranslation("common");

  // Calculator icon fix

  // Interactive Dashboard Component - FleetCore Style
  function LiveDashboard() {
    const dashboardData = {
      operations: {
        kpis: [
          { label: "Online Now", value: "247", change: "+12", color: "green" },
          { label: "Available Cars", value: "89", change: "-3", color: "blue" },
          {
            label: "In Maintenance",
            value: "12",
            change: "0",
            color: "orange",
          },
          {
            label: "Today Trips",
            value: "1,847",
            change: "+234",
            color: "purple",
          },
        ],
        drivers: [
          {
            id: "DRV001",
            name: "Ahmed K.",
            car: "Toyota Camry",
            platform: "Uber",
            status: "online",
            trips: 12,
            revenue: "€287",
            rating: 4.9,
          },
          {
            id: "DRV002",
            name: "Sarah M.",
            car: "BMW 320i",
            platform: "Bolt",
            status: "busy",
            trips: 8,
            revenue: "€198",
            rating: 4.8,
          },
          {
            id: "DRV003",
            name: "John D.",
            car: "Mercedes E",
            platform: "Careem",
            status: "offline",
            trips: 15,
            revenue: "€412",
            rating: 5.0,
          },
          {
            id: "DRV004",
            name: "Maria L.",
            car: "Audi A4",
            platform: "Uber",
            status: "online",
            trips: 10,
            revenue: "€265",
            rating: 4.7,
          },
          {
            id: "DRV005",
            name: "Hassan R.",
            car: "Tesla M3",
            platform: "Yango",
            status: "busy",
            trips: 14,
            revenue: "€378",
            rating: 4.9,
          },
        ],
        alerts: [
          {
            type: "urgent",
            message: "Vehicle BMW-089 service overdue by 500km",
          },
          {
            type: "warning",
            message: "5 drivers approaching weekly hour limit",
          },
          { type: "info", message: "New Uber rate cards effective tomorrow" },
        ],
      },
      financial: {
        kpis: [
          {
            label: "Today Revenue",
            value: "€18,750",
            change: "+18%",
            color: "green",
          },
          {
            label: "Week Revenue",
            value: "€124,320",
            change: "+12%",
            color: "blue",
          },
          {
            label: "Outstanding",
            value: "€8,450",
            change: "-€2,100",
            color: "orange",
          },
          {
            label: "Net Margin",
            value: "28.4%",
            change: "+2.1%",
            color: "purple",
          },
        ],
        breakdown: [
          {
            platform: "Uber",
            trips: 487,
            gross: "€8,234",
            commission: "€2,058",
            net: "€6,176",
          },
          {
            platform: "Bolt",
            trips: 312,
            gross: "€5,421",
            commission: "€1,355",
            net: "€4,066",
          },
          {
            platform: "Careem",
            trips: 198,
            gross: "€3,234",
            commission: "€808",
            net: "€2,426",
          },
          {
            platform: "Yango",
            trips: 156,
            gross: "€2,456",
            commission: "€614",
            net: "€1,842",
          },
          {
            platform: "Office",
            trips: 43,
            gross: "€1,987",
            commission: "€0",
            net: "€1,987",
          },
        ],
      },
      maintenance: {
        scheduled: [
          {
            vehicle: "BMW-001",
            service: "Oil Change",
            date: "Today 14:00",
            garage: "Main Garage",
            cost: "€120",
          },
          {
            vehicle: "MERC-045",
            service: "Brake Service",
            date: "Tomorrow 10:00",
            garage: "City Center",
            cost: "€450",
          },
          {
            vehicle: "AUDI-023",
            service: "Tire Rotation",
            date: "Dec 28",
            garage: "Main Garage",
            cost: "€80",
          },
          {
            vehicle: "TESLA-012",
            service: "Software Update",
            date: "Dec 29",
            garage: "Tesla Service",
            cost: "€0",
          },
        ],
        costs: {
          thisMonth: "€12,450",
          lastMonth: "€14,230",
          average: "€13,340",
          perVehicle: "€124",
        },
      },
    };

    return (
      <div className="mx-auto w-full max-w-7xl">
        {/* Dashboard Frame - FleetCore Style */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 p-1 shadow-2xl dark:from-gray-900 dark:to-gray-800">
          <div className="rounded-xl bg-white dark:bg-gray-950">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
              <div className="flex items-center gap-6">
                {/* Tabs */}
                <div className="flex rounded-lg bg-white p-1 shadow-sm dark:bg-gray-800">
                  <button
                    onClick={() => setDashboardView("operations")}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      dashboardView === "operations"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    Operations
                  </button>
                  <button
                    onClick={() => setDashboardView("financial")}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      dashboardView === "financial"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    Financial
                  </button>
                  <button
                    onClick={() => setDashboardView("maintenance")}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      dashboardView === "maintenance"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    Maintenance
                  </button>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Today, Dec 24</span>
                </div>
              </div>

              {/* Live Status */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Circle className="h-2 w-2 animate-pulse fill-green-500 text-green-500" />
                  <span>Live Data</span>
                </div>
                <button className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Settings className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {dashboardView === "operations" && (
                  <motion.div
                    key="operations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      {dashboardData.operations.kpis.map((kpi, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {kpi.label}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                kpi.change.startsWith("+")
                                  ? "text-green-600"
                                  : kpi.change.startsWith("-")
                                    ? "text-red-600"
                                    : "text-gray-600"
                              }`}
                            >
                              {kpi.change}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {kpi.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Alerts */}
                    {dashboardData.operations.alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 rounded-lg p-3 ${
                          alert.type === "urgent"
                            ? "border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                            : alert.type === "warning"
                              ? "border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                              : "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                        }`}
                      >
                        <AlertCircle
                          className={`mt-0.5 h-4 w-4 ${
                            alert.type === "urgent"
                              ? "text-red-600"
                              : alert.type === "warning"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {alert.message}
                        </span>
                      </div>
                    ))}

                    {/* Driver Table */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                      <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Active Drivers
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800">
                              <th className="pb-2 text-left">Driver</th>
                              <th className="pb-2 text-left">Vehicle</th>
                              <th className="pb-2 text-left">Platform</th>
                              <th className="pb-2 text-left">Status</th>
                              <th className="pb-2 text-center">Trips</th>
                              <th className="pb-2 text-right">Revenue</th>
                              <th className="pb-2 text-center">Rating</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {dashboardData.operations.drivers.map(
                              (driver, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-gray-100 dark:border-gray-800"
                                >
                                  <td className="py-3">
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {driver.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {driver.id}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="py-3 text-gray-600 dark:text-gray-400">
                                    {driver.car}
                                  </td>
                                  <td className="py-3">
                                    <span className="rounded bg-gray-200 px-2 py-1 text-xs font-medium dark:bg-gray-800">
                                      {driver.platform}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span
                                      className={`rounded px-2 py-1 text-xs font-medium ${
                                        driver.status === "online"
                                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                          : driver.status === "busy"
                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                      }`}
                                    >
                                      {driver.status}
                                    </span>
                                  </td>
                                  <td className="py-3 text-center text-gray-900 dark:text-white">
                                    {driver.trips}
                                  </td>
                                  <td className="py-3 text-right font-semibold text-green-600">
                                    {driver.revenue}
                                  </td>
                                  <td className="py-3 text-center">
                                    <span className="text-xs font-medium">
                                      ⭐ {driver.rating}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {dashboardView === "financial" && (
                  <motion.div
                    key="financial"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Financial KPIs */}
                    <div className="grid grid-cols-4 gap-4">
                      {dashboardData.financial.kpis.map((kpi, i) => (
                        <div
                          key={i}
                          className={`bg-gradient-to-br ${
                            kpi.color === "green"
                              ? "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                              : kpi.color === "blue"
                                ? "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                                : kpi.color === "orange"
                                  ? "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20"
                                  : "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                          } rounded-xl border border-gray-200 p-4 dark:border-gray-800`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {kpi.label}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                kpi.change.includes("+")
                                  ? "text-green-600"
                                  : kpi.change.includes("-€")
                                    ? "text-red-600"
                                    : "text-orange-600"
                              }`}
                            >
                              {kpi.change}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {kpi.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Platform Breakdown */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Platform Revenue Breakdown
                      </h3>
                      <div className="space-y-3">
                        {dashboardData.financial.breakdown.map(
                          (platform, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                                    platform.platform === "Uber"
                                      ? "bg-black text-white"
                                      : platform.platform === "Bolt"
                                        ? "bg-green-600 text-white"
                                        : platform.platform === "Careem"
                                          ? "bg-orange-600 text-white"
                                          : platform.platform === "Yango"
                                            ? "bg-yellow-500 text-black"
                                            : "bg-blue-600 text-white"
                                  }`}
                                >
                                  <span className="text-xs font-bold">
                                    {platform.platform.slice(0, 2)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {platform.platform}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {platform.trips} trips today
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Gross</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {platform.gross}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Commission
                                  </p>
                                  <p className="font-semibold text-red-600">
                                    {platform.commission}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Net</p>
                                  <p className="font-bold text-green-600">
                                    {platform.net}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {dashboardView === "maintenance" && (
                  <motion.div
                    key="maintenance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Maintenance Costs */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                        <p className="mb-1 text-xs text-gray-500">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboardData.maintenance.costs.thisMonth}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                        <p className="mb-1 text-xs text-gray-500">Last Month</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboardData.maintenance.costs.lastMonth}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                        <p className="mb-1 text-xs text-gray-500">Average</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboardData.maintenance.costs.average}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                        <p className="mb-1 text-xs text-gray-500">
                          Per Vehicle
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboardData.maintenance.costs.perVehicle}
                        </p>
                      </div>
                    </div>

                    {/* Scheduled Services */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Scheduled Services
                      </h3>
                      <div className="space-y-3">
                        {dashboardData.maintenance.scheduled.map(
                          (service, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
                            >
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                  <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {service.vehicle}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {service.service}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {service.date}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {service.garage}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {service.cost}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gray-50 dark:bg-gray-950">
        {/* Navigation */}
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
                              onMouseEnter={() => setActiveTab("rental")}
                              className={`w-full px-6 py-3 text-left font-medium transition-colors ${activeTab === "rental" ? "border-l-4 border-blue-600 bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                            >
                              {t("homepage.productMenu.tabs.rental")}
                            </button>
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
                          {activeTab === "rental" && (
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.rental.items.0.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.rental.items.0.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.rental.items.1.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.rental.items.1.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.rental.items.2.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.rental.items.2.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.rental.items.3.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.rental.items.3.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.rental.items.4.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.rental.items.4.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.rental.items.5.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.rental.items.5.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {activeTab === "fleet" && (
                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.fleet.items.0.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.fleet.items.0.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.fleet.items.1.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.fleet.items.1.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.fleet.items.2.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.fleet.items.2.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.fleet.items.3.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.fleet.items.3.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.fleet.items.4.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.fleet.items.4.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.productMenu.fleet.items.5.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.productMenu.fleet.items.5.desc"
                                    )}
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
                              onMouseEnter={() =>
                                setActiveSolutionTab("industry")
                              }
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
                              onMouseEnter={() =>
                                setActiveSolutionTab("usecase")
                              }
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
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.solutionsMenu.industry.items.5.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.industry.items.5.desc"
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
                                    {t(
                                      "homepage.solutionsMenu.size.items.0.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.size.items.0.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.solutionsMenu.size.items.1.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.size.items.1.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.solutionsMenu.size.items.2.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.size.items.2.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.solutionsMenu.size.items.3.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.size.items.3.desc"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.solutionsMenu.size.items.4.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.size.items.4.desc"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {t(
                                      "homepage.solutionsMenu.size.items.5.title"
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                      "homepage.solutionsMenu.size.items.5.desc"
                                    )}
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

        {/* Hero Section with Video */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
          {/* Video Background */}
          <div className="absolute inset-0 h-full w-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            >
              <source src="/videos/hero-bg.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 via-gray-900/70 to-gray-900/90" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-2 backdrop-blur-xl"
            >
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {t("homepage.hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              className="mb-6 text-5xl leading-tight font-bold text-white lg:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {t("homepage.hero.title")}
            </motion.h1>

            <motion.p
              className="mx-auto mb-12 max-w-4xl text-xl text-gray-300 lg:text-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {t("homepage.hero.subtitle")}
            </motion.p>

            {/* Live Metrics */}
            <motion.div
              className="mx-auto mb-12 grid max-w-4xl grid-cols-2 gap-6 lg:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  {metrics.activeVehicles}
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.vehicles")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  €{metrics.dailyRevenue}
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.revenue")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  {metrics.utilization.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.utilization")}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
                <p className="text-3xl font-bold text-white">
                  {metrics.activeBookings}
                </p>
                <p className="text-sm text-gray-400">
                  {t("homepage.hero.metrics.bookings")}
                </p>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              <Link
                href={localizedPath("request-demo")}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-4 text-lg font-bold text-white transition-all hover:shadow-2xl"
              >
                {t("homepage.cta.button")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20">
                {locale === "en" ? "Watch Demo Video" : "Voir la Vidéo de Démo"}
              </button>
            </motion.div>
          </div>
        </section>

        {/* Interactive Dashboard Section */}
        <section className="bg-white py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.dashboard.title")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("homepage.dashboard.subtitle")}
              </p>
            </div>

            <LiveDashboard />
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-20 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.featuresSection.title")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("homepage.featuresSection.subtitle")}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Car Rental Management - NEW SECTION */}
              <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("homepage.features.carRental.title")}
                </h3>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t("homepage.features.carRental.items.0.name")}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("homepage.features.carRental.items.0.desc")}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <FileSignature className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t("homepage.features.carRental.items.1.name")}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("homepage.features.carRental.items.1.desc")}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t("homepage.features.carRental.items.2.name")}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("homepage.features.carRental.items.2.desc")}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t("homepage.features.carRental.items.3.name")}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("homepage.features.carRental.items.3.desc")}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t("homepage.features.carRental.items.4.name")}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("homepage.features.carRental.items.4.desc")}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {t("homepage.features.carRental.items.5.name")}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("homepage.features.carRental.items.5.desc")}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Fleet Management Features */}
              <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-6 text-2xl font-bold text-gray-900 lg:whitespace-nowrap dark:text-white">
                  {t("homepage.features.rental.title")}
                </h3>
                <div className="space-y-4">
                  {ready &&
                    (
                      t("homepage.features.rental.items", {
                        returnObjects: true,
                      }) as FeatureItem[]
                    ).map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          className="flex gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            {Icon && (
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {feature.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {feature.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>

              {/* Platform Integration Features */}
              <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
                <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  {t("homepage.features.ridehailing.title")}
                </h3>
                <div className="space-y-4">
                  {ready &&
                    (
                      t("homepage.features.ridehailing.items", {
                        returnObjects: true,
                      }) as FeatureItem[]
                    ).map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          className="flex gap-4"
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                            {Icon && (
                              <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {feature.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {feature.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Timeline */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.process.title")}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {t("homepage.process.subtitle")}
              </p>
            </div>

            <div className="mx-auto flex max-w-5xl items-center justify-between">
              {ready &&
                (
                  t("homepage.process.steps", {
                    returnObjects: true,
                  }) as ProcessStep[]
                ).map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={index}
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                        {Icon && <Icon className="h-8 w-8 text-white" />}
                      </div>
                      <h3 className="mb-1 font-bold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                        {step.desc}
                      </p>
                      <p className="max-w-[150px] text-xs text-gray-500">
                        {step.detail}
                      </p>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="bg-white py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.integrations.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              {ready &&
                Object.entries(
                  t("homepage.integrations.categories", { returnObjects: true })
                ).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {ready &&
                        (items as string[]).map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {item}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Proof Section */}
        <section className="bg-gray-50 py-20 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                {t("homepage.proof.title")}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {ready &&
                (
                  t("homepage.proof.metrics", {
                    returnObjects: true,
                  }) as ProofMetric[]
                ).map((metric, index) => (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
                      {metric.value}
                    </div>
                    <div className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {metric.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.desc}
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 text-4xl font-bold text-white">
              {t("homepage.cta.title")}
            </h2>
            <p className="mb-8 text-xl text-white/90">
              {t("homepage.cta.subtitle")}
            </p>
            <Link
              href={localizedPath("request-demo")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-gray-900 transition-all hover:shadow-2xl"
            >
              {t("homepage.cta.button")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 grid gap-8 md:grid-cols-4">
              {/* Brand */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">FleetCore</span>
                </div>
                <p className="text-gray-400">
                  The Operating System for Modern Fleet Management
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="mb-4 font-semibold">
                  {t("homepage.footer.product")}
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/features" className="hover:text-white">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/integrations" className="hover:text-white">
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">
                  {t("homepage.footer.company")}
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/about" className="hover:text-white">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">
                  {t("homepage.footer.legal")}
                </h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/privacy" className="hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>{t("homepage.footer.copyright")}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
