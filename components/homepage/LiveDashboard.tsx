"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wrench, AlertCircle, Calendar, Settings, Circle } from "lucide-react";
import { dashboardData, type DashboardView } from "@/lib/data/dashboard-mock";

interface LiveDashboardProps {
  dashboardView: DashboardView;
  setDashboardView: (view: DashboardView) => void;
}

export function LiveDashboard({
  dashboardView,
  setDashboardView,
}: LiveDashboardProps) {
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
                          {dashboardData.operations.drivers.map((driver, i) => (
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
                          ))}
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
                      {dashboardData.financial.breakdown.map((platform, i) => (
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
                      ))}
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
                      <p className="mb-1 text-xs text-gray-500">Per Vehicle</p>
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
                      {dashboardData.maintenance.scheduled.map((service, i) => (
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
                      ))}
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
