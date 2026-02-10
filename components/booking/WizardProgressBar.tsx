/**
 * WizardProgressBar - V6.2.2 Book Demo Wizard
 *
 * Visual progress indicator for multi-step wizard flow.
 *
 * Features:
 * - Step indicators (filled/active/empty circles)
 * - Progress bar fill animation
 * - RTL support
 * - Responsive design
 *
 * @module components/booking/WizardProgressBar
 */

"use client";

import { useTranslation } from "react-i18next";

interface WizardProgressBarProps {
  /** Current step number (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional class name for customization */
  className?: string;
}

export function WizardProgressBar({
  currentStep,
  totalSteps,
  className = "",
}: WizardProgressBarProps) {
  const { t } = useTranslation("public");

  // Calculate progress percentage
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Step label */}
      <div className="mb-3 text-center text-sm font-medium text-gray-600 dark:text-slate-400">
        {t("bookDemo.progress.step")} {currentStep} {t("bookDemo.progress.of")}{" "}
        {totalSteps}
      </div>

      {/* Progress bar with circles */}
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-gray-300 rtl:scale-x-[-1] dark:bg-slate-700" />

        {/* Filled progress */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out ltr:left-0 rtl:right-0 rtl:scale-x-[-1]"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Step circles with labels */}
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const label = t(`bookDemo.progress.labels.${stepNum}`, {
            defaultValue: "",
          });

          return (
            <div
              key={stepNum}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "border-blue-500 bg-blue-500 text-white"
                    : isActive
                      ? "border-blue-500 bg-white text-blue-500 ring-4 ring-blue-500/20 dark:bg-slate-900"
                      : "border-gray-300 bg-gray-100 text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              {label && (
                <span
                  className={`mt-1.5 text-xs font-medium ${
                    isCompleted || isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-slate-500"
                  }`}
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WizardProgressBar;
