/**
 * HoneypotField - Anti-spam honeypot input
 *
 * V6.2.3 - Reusable honeypot component for form spam protection
 *
 * A hidden input field designed to trap spam bots.
 * Bots typically fill all form fields, including hidden ones.
 * If this field is filled, the submission is likely from a bot.
 *
 * Usage:
 * 1. Add this component to your form
 * 2. Check if the value is non-empty before form submission
 * 3. If non-empty, silently "succeed" without processing (don't alert the bot)
 *
 * @module components/forms/HoneypotField
 */

"use client";

interface HoneypotFieldProps {
  /**
   * Current value of the honeypot field
   */
  value: string;

  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;

  /**
   * Optional field name (default: "website")
   * Use common field names that bots are likely to fill
   */
  name?: string;
}

/**
 * Hidden honeypot input to detect spam bots
 *
 * The input is positioned off-screen and invisible to humans
 * but visible to automated bots that fill all form fields.
 */
export function HoneypotField({
  value,
  onChange,
  name = "website",
}: HoneypotFieldProps) {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
    />
  );
}
