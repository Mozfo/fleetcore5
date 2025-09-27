"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Building,
  Phone,
  Users,
  MessageSquare,
  Send,
  CheckCircle,
  Car,
} from "lucide-react";

interface FormData {
  fullName: string;
  email: string;
  company: string;
  fleetSize: string;
  phone: string;
  message: string;
  agreeToTerms: boolean;
}

export default function RequestDemoForm() {
  const { t } = useTranslation("public");
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    company: "",
    fleetSize: "",
    phone: "",
    message: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim())
      newErrors.fullName = t("requestDemo.form.errors.required");
    if (!formData.email.trim())
      newErrors.email = t("requestDemo.form.errors.required");
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = t("requestDemo.form.errors.invalidEmail");
    if (!formData.company.trim())
      newErrors.company = t("requestDemo.form.errors.required");
    if (!formData.fleetSize)
      newErrors.fleetSize = t("requestDemo.form.errors.required");
    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = t("requestDemo.form.errors.agreeRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          company_name: formData.company,
          fleet_size: formData.fleetSize,
          phone: formData.phone,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md rounded-2xl bg-white p-12 text-center shadow-xl dark:bg-gray-800"
        >
          <CheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            {t("requestDemo.form.success.title")}
          </h2>
          <p className="mb-2 text-gray-600 dark:text-gray-400">
            {t("requestDemo.form.success.message")}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("requestDemo.form.success.subMessage")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left side - Welcome Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-700">
              <Car className="h-8 w-8 text-white" />
            </div>

            <h1 className="mb-4 text-4xl font-bold text-gray-900 lg:text-5xl dark:text-white">
              {t("requestDemo.title")}
            </h1>

            <p className="mb-6 text-xl text-blue-600 dark:text-blue-400">
              {t("requestDemo.subtitle")}
            </p>

            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              {t("requestDemo.intro")}
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Car className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Car Rental
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All-in-one Management Platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Multi-Platform Integration
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uber, Bolt, Careem, and more
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Fleet Analytics
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time metrics & reporting
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Enterprise Ready
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scalable for any fleet size
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800"
            >
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {t("requestDemo.form.title")}
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                {t("requestDemo.form.subtitle")}
              </p>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("requestDemo.form.fullName")} *
                  </label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className={`w-full rounded-lg border py-2.5 pr-3 pl-10 ${
                        errors.fullName
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white text-gray-900 focus:border-blue-600 focus:outline-none dark:bg-gray-700 dark:text-white`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("requestDemo.form.email")} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full rounded-lg border py-2.5 pr-3 pl-10 ${
                        errors.email
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white text-gray-900 focus:border-blue-600 focus:outline-none dark:bg-gray-700 dark:text-white`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("requestDemo.form.company")} *
                  </label>
                  <div className="relative">
                    <Building className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className={`w-full rounded-lg border py-2.5 pr-3 pl-10 ${
                        errors.company
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-white text-gray-900 focus:border-blue-600 focus:outline-none dark:bg-gray-700 dark:text-white`}
                    />
                  </div>
                  {errors.company && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.company}
                    </p>
                  )}
                </div>

                {/* Fleet Size */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("requestDemo.form.fleetSize")} *
                  </label>
                  <select
                    value={formData.fleetSize}
                    onChange={(e) =>
                      setFormData({ ...formData, fleetSize: e.target.value })
                    }
                    className={`w-full rounded-lg border px-3 py-2.5 ${
                      errors.fleetSize
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white text-gray-900 focus:border-blue-600 focus:outline-none dark:bg-gray-700 dark:text-white`}
                  >
                    <option value="">
                      {t("requestDemo.form.selectOption")}
                    </option>
                    {(
                      t("requestDemo.form.fleetOptions", {
                        returnObjects: true,
                      }) as string[]
                    ).map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.fleetSize && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fleetSize}
                    </p>
                  )}
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("requestDemo.form.phone")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-3 pl-10 text-gray-900 focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Message (Optional) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("requestDemo.form.message")}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-600 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Terms */}
                <div>
                  <label className="flex cursor-pointer items-start">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreeToTerms: e.target.checked,
                        })
                      }
                      className="mt-1 mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t("requestDemo.form.terms")}{" "}
                      <a
                        href="#"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {t("requestDemo.form.termsLink")}
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {t("requestDemo.form.privacyLink")}
                      </a>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.agreeToTerms}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-700 py-3 font-semibold text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {t("requestDemo.form.submit")}
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  {t("requestDemo.form.disclaimer")}
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
