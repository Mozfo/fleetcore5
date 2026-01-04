"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Check,
  TrendingUp,
  MapPin,
  FileText,
  Wallet,
  Fuel,
  Calculator,
} from "lucide-react";
import {
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/utils/format-currency";

interface FeatureItem {
  title: string;
  subtitle: string;
  items: string[];
}

export function FeatureSections() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language || "en";

  const features: Array<{
    key: "earnings" | "mileage" | "taxes";
    icon: typeof TrendingUp;
    color: string;
    mockup: React.ReactNode;
  }> = [
    {
      key: "earnings",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      mockup: <EarningsMockup locale={locale} />,
    },
    {
      key: "mileage",
      icon: MapPin,
      color: "from-blue-500 to-cyan-600",
      mockup: <MileageMockup locale={locale} />,
    },
    {
      key: "taxes",
      icon: FileText,
      color: "from-purple-500 to-pink-600",
      mockup: <TaxesMockup locale={locale} />,
    },
  ];

  return (
    <section className="bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {features.map((feature, index) => {
          const featureData = t(`solopreneur.features.${feature.key}`, {
            returnObjects: true,
          }) as FeatureItem;
          const isReversed = index % 2 === 1;
          const Icon = feature.icon;

          return (
            <div
              key={feature.key}
              className={`flex flex-col items-center gap-12 py-16 lg:flex-row lg:gap-20 ${
                isReversed ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                {/* Icon Badge */}
                <div
                  className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                  {featureData.title}
                </h3>

                {/* Subtitle */}
                <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
                  {featureData.subtitle}
                </p>

                {/* Feature List */}
                <ul className="space-y-4">
                  {featureData.items.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Mockup */}
              <motion.div
                initial={{ opacity: 0, x: isReversed ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                {feature.mockup}
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Earnings Mockup Component
function EarningsMockup({ locale }: { locale: string }) {
  const platforms = [
    { name: "Uber", amount: 687.3, percent: 55, color: "bg-gray-900" },
    { name: "Bolt", amount: 412.2, percent: 33, color: "bg-green-500" },
    { name: "Careem", amount: 148.0, percent: 12, color: "bg-green-600" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          This Week
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(1247.5, locale)}
        </span>
      </div>

      {/* Platform breakdown */}
      <div className="space-y-3">
        {platforms.map((platform) => (
          <div key={platform.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {platform.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(platform.amount, locale)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${platform.percent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full ${platform.color}`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="mt-6 flex items-end justify-between gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
          const heights = [45, 70, 55, 85, 65, 90, 75];
          return (
            <div key={day} className="flex-1 text-center">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: heights[i] }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="mx-auto mb-2 w-full max-w-8 rounded-t bg-gradient-to-t from-blue-500 to-purple-500"
              />
              <span className="text-xs text-gray-500">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mileage Mockup Component
function MileageMockup({ locale }: { locale: string }) {
  const trips = [
    { time: "2:45 PM", miles: "12.3 mi", deduction: 7.38 },
    { time: "1:20 PM", miles: "8.7 mi", deduction: 5.22 },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      {/* Map placeholder */}
      <div className="relative mb-4 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40">
        {/* Route line */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 160">
          <motion.path
            d="M 30 120 Q 100 40 150 80 T 270 40"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />
          {/* Start point */}
          <circle cx="30" cy="120" r="6" fill="#22C55E" />
          {/* End point */}
          <circle cx="270" cy="40" r="6" fill="#EF4444" />
        </svg>

        {/* Location pin */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-4 right-6"
        >
          <MapPin className="h-6 w-6 text-blue-600" />
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            87.4
          </div>
          <div className="text-xs text-gray-500">Miles Today</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(52.44, locale)}
          </div>
          <div className="text-xs text-gray-500">Deduction</div>
        </div>
        <div className="flex items-center justify-center">
          <Fuel className="h-5 w-5 text-orange-500" />
          <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrency(24.5, locale)}
          </span>
        </div>
      </div>

      {/* Trip log */}
      <div className="mt-4 space-y-2">
        {trips.map((trip, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-gray-800"
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {trip.time}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {trip.miles}
            </span>
            <span className="text-sm text-green-600">
              {formatCurrency(trip.deduction, locale)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Taxes Mockup Component
function TaxesMockup({ locale }: { locale: string }) {
  const deductions = [
    { label: "Mileage Deduction", value: 3240, icon: MapPin },
    { label: "Phone & Data", value: 720, icon: Wallet },
    { label: "Car Expenses", value: 867, icon: Fuel },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            2024 Tax Summary
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrencyCompact(4827, locale)} saved
          </div>
        </div>
        <Calculator className="h-8 w-8 text-purple-500" />
      </div>

      {/* Deduction categories */}
      <div className="space-y-4">
        {deductions.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between rounded-lg bg-white p-4 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                  <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrencyCompact(item.value, locale)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Export button */}
      <button className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-all hover:shadow-lg">
        Export Tax Report
      </button>
    </div>
  );
}
