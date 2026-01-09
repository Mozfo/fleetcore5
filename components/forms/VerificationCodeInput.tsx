/**
 * VerificationCodeInput - V6.2.2 Book Demo Wizard
 *
 * 6-digit verification code input with individual digit boxes.
 *
 * Features:
 * - Auto-advance on input
 * - Backspace navigation
 * - Paste support (full code)
 * - Auto-submit on completion
 * - Error state styling
 * - RTL support
 *
 * @module components/forms/VerificationCodeInput
 */

"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";
import { motion } from "framer-motion";

export interface VerificationCodeInputProps {
  /** Number of digits (default: 6) */
  length?: number;
  /** Callback when all digits are entered */
  onComplete: (code: string) => void;
  /** Disable all inputs */
  disabled?: boolean;
  /** Show error state (red borders) */
  error?: boolean;
  /** Auto-focus first input on mount */
  autoFocus?: boolean;
  /** Trigger shake animation */
  shake?: boolean;
  /** Clear inputs externally */
  clearTrigger?: number;
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
  shake = false,
  clearTrigger = 0,
}: VerificationCodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Clear inputs when clearTrigger changes
  useEffect(() => {
    if (clearTrigger > 0) {
      setValues(Array(length).fill(""));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  }, [clearTrigger, length]);

  // Check completion and call onComplete
  const checkCompletion = useCallback(
    (newValues: string[]) => {
      const code = newValues.join("");
      if (code.length === length && newValues.every((v) => v !== "")) {
        onComplete(code);
      }
    },
    [length, onComplete]
  );

  // Handle single character input
  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Only accept numeric input
      if (value && !/^\d$/.test(value)) {
        return;
      }

      const newValues = [...values];
      newValues[index] = value;
      setValues(newValues);

      // Auto-advance to next input
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      checkCompletion(newValues);
    },
    [values, length, checkCompletion]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      // Backspace: clear current or go back
      if (e.key === "Backspace") {
        if (values[index]) {
          // Clear current
          const newValues = [...values];
          newValues[index] = "";
          setValues(newValues);
        } else if (index > 0) {
          // Go back and clear previous
          inputRefs.current[index - 1]?.focus();
          const newValues = [...values];
          newValues[index - 1] = "";
          setValues(newValues);
        }
        e.preventDefault();
      }

      // Arrow keys navigation
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        e.preventDefault();
      }
    },
    [values, length]
  );

  // Handle paste
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");

      // Extract only digits
      const digits = pastedData.replace(/\D/g, "").slice(0, length);

      if (digits.length > 0) {
        const newValues = Array(length).fill("");
        digits.split("").forEach((digit, i) => {
          newValues[i] = digit;
        });
        setValues(newValues);

        // Focus appropriate input
        const focusIndex = Math.min(digits.length, length - 1);
        inputRefs.current[focusIndex]?.focus();

        checkCompletion(newValues);
      }
    },
    [length, checkCompletion]
  );

  // Handle focus - select content
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  // Shake animation variants
  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 },
    },
    idle: { x: 0 },
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-2 sm:gap-3"
      variants={shakeVariants}
      animate={shake ? "shake" : "idle"}
      dir="ltr" // Always LTR for number input
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={values[index]}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          autoComplete="one-time-code"
          className={`h-14 w-11 rounded-lg border-2 bg-white text-center font-mono text-2xl font-bold text-gray-900 transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-14 sm:text-3xl dark:bg-slate-900/50 dark:text-white ${
            error
              ? "border-red-500 focus:ring-red-500"
              : values[index]
                ? "border-blue-500 focus:ring-blue-500"
                : "border-gray-300 focus:ring-blue-500 dark:border-slate-600"
          }`}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </motion.div>
  );
}

export default VerificationCodeInput;
