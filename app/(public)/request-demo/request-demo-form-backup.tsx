"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building,
  Mail,
  Phone,
  Globe,
  Users,
  Car,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Circle,
  Loader2,
  Send,
  MapPin,
  Briefcase,
  Target,
  Clock,
  Shield,
  CreditCard,
  Zap,
  Award,
  TrendingUp,
} from "lucide-react";

interface FormData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Company Info
  companyName: string;
  companySize: string;
  industry: string;
  country: string;

  // Fleet Details
  fleetSize: string;
  vehicleTypes: string[];
  currentChallenges: string[];

  // Requirements
  timeline: string;
  budget: string;
  additionalInfo: string;
}

export default function RequestDemoForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    companySize: "",
    industry: "",
    country: "",
    fleetSize: "",
    vehicleTypes: [],
    currentChallenges: [],
    timeline: "",
    budget: "",
    additionalInfo: "",
  });

  const totalSteps = 4;

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (
    field: "vehicleTypes" | "currentChallenges",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone
        );
      case 2:
        return !!(
          formData.companyName &&
          formData.companySize &&
          formData.industry &&
          formData.country
        );
      case 3:
        return !!(formData.fleetSize && formData.vehicleTypes.length > 0);
      case 4:
        return !!(formData.timeline && formData.budget);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(totalSteps)) return;

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would normally send to your API
      console.log("Form submitted:", formData);

      setSubmitStatus("success");
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleOptions = [
    "Sedan",
    "SUV",
    "Van",
    "Truck",
    "Luxury",
    "Electric",
    "Hybrid",
    "Bus",
  ];

  const challengeOptions = [
    "Vehicle Tracking",
    "Driver Management",
    "Revenue Optimization",
    "Maintenance Scheduling",
    "Compliance",
    "Cost Reduction",
    "Route Optimization",
    "Customer Management",
  ];

  const stepTitles = [
    "Personal Information",
    "Company Details",
    "Fleet Information",
    "Requirements & Timeline",
  ];

  const stepIcons = [User, Building, Car, Calendar];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            {stepTitles.map((title, index) => {
              const Icon = stepIcons[index];
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;

              return (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                        isCompleted
                          ? "bg-gradient-to-br from-blue-600 to-purple-700"
                          : isActive
                            ? "bg-gradient-to-br from-blue-600 to-purple-700"
                            : "bg-gray-200 dark:bg-white/10"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <Icon
                          className={`h-6 w-6 ${isActive ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs ${isActive ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
                    >
                      {title}
                    </span>
                  </div>
                  {index < stepTitles.length - 1 && (
                    <div
                      className={`mx-4 h-0.5 w-24 transition-all duration-300 ${
                        isCompleted
                          ? "bg-gradient-to-r from-blue-600 to-purple-700"
                          : "bg-gray-200 dark:bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
        >
          <div className="p-8">
            <AnimatePresence mode="wait">
              {submitStatus === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-16 text-center"
                >
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                    <CheckCircle className="h-10 w-10 text-gray-900 dark:text-gray-900 dark:text-white" />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                    Thank You!
                  </h2>
                  <p className="mx-auto max-w-md text-gray-400">
                    Your demo request has been received. Our team will contact
                    you within 24 hours to schedule your personalized demo.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                          Let&apos;s get to know you
                        </h3>
                        <p className="text-gray-400">
                          Tell us about yourself so we can personalize your demo
                          experience.
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm text-gray-400">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) =>
                              handleInputChange("firstName", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm text-gray-400">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                              handleInputChange("lastName", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 pr-4 pl-12 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 pr-4 pl-12 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            placeholder="+971 50 123 4567"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Company Details */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                          About your company
                        </h3>
                        <p className="text-gray-400">
                          Help us understand your business better.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Company Name *
                        </label>
                        <div className="relative">
                          <Building className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) =>
                              handleInputChange("companyName", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 pr-4 pl-12 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            placeholder="Acme Fleet Services"
                          />
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm text-gray-400">
                            Company Size *
                          </label>
                          <select
                            value={formData.companySize}
                            onChange={(e) =>
                              handleInputChange("companySize", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                          >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm text-gray-400">
                            Industry *
                          </label>
                          <select
                            value={formData.industry}
                            onChange={(e) =>
                              handleInputChange("industry", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                          >
                            <option value="">Select industry</option>
                            <option value="rental">Car Rental</option>
                            <option value="ridehailing">Ride-Hailing</option>
                            <option value="logistics">Logistics</option>
                            <option value="corporate">Corporate Fleet</option>
                            <option value="delivery">Delivery Services</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Country *
                        </label>
                        <div className="relative">
                          <Globe className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                          <select
                            value={formData.country}
                            onChange={(e) =>
                              handleInputChange("country", e.target.value)
                            }
                            className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 pr-4 pl-12 text-gray-900 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                          >
                            <option value="">Select country</option>
                            <option value="ae">United Arab Emirates</option>
                            <option value="sa">Saudi Arabia</option>
                            <option value="qa">Qatar</option>
                            <option value="kw">Kuwait</option>
                            <option value="bh">Bahrain</option>
                            <option value="om">Oman</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Fleet Information */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                          Fleet Details
                        </h3>
                        <p className="text-gray-400">
                          Tell us about your fleet and current challenges.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Fleet Size *
                        </label>
                        <select
                          value={formData.fleetSize}
                          onChange={(e) =>
                            handleInputChange("fleetSize", e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-gray-900 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                        >
                          <option value="">Select fleet size</option>
                          <option value="1-25">1-25 vehicles</option>
                          <option value="26-100">26-100 vehicles</option>
                          <option value="101-500">101-500 vehicles</option>
                          <option value="501-1000">501-1000 vehicles</option>
                          <option value="1000+">1000+ vehicles</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-4 block text-sm text-gray-400">
                          Vehicle Types * (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {vehicleOptions.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                handleArrayToggle("vehicleTypes", type)
                              }
                              className={`rounded-lg border px-4 py-2.5 transition-all ${
                                formData.vehicleTypes.includes(type)
                                  ? "border-transparent bg-gradient-to-r from-blue-600 to-purple-700 text-gray-900 dark:text-gray-900 dark:text-white"
                                  : "border-gray-300 bg-white/5 text-gray-400 hover:border-white/40 dark:border-white/20"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-4 block text-sm text-gray-400">
                          Current Challenges (Select all that apply)
                        </label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {challengeOptions.map((challenge) => (
                            <button
                              key={challenge}
                              type="button"
                              onClick={() =>
                                handleArrayToggle(
                                  "currentChallenges",
                                  challenge
                                )
                              }
                              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                                formData.currentChallenges.includes(challenge)
                                  ? "border-[#A47864] bg-gradient-to-r from-[#A47864]/20 to-[#D4735F]/20 text-gray-900 dark:text-gray-900 dark:text-white"
                                  : "border-gray-300 bg-white/5 text-gray-400 hover:border-white/40 dark:border-white/20"
                              }`}
                            >
                              {formData.currentChallenges.includes(
                                challenge
                              ) ? (
                                <CheckCircle className="h-5 w-5 text-[#A47864]" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                              {challenge}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Requirements & Timeline */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                          Requirements & Timeline
                        </h3>
                        <p className="text-gray-400">
                          Let us know your timeline and budget to better assist
                          you.
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm text-gray-400">
                            Implementation Timeline *
                          </label>
                          <div className="relative">
                            <Clock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                            <select
                              value={formData.timeline}
                              onChange={(e) =>
                                handleInputChange("timeline", e.target.value)
                              }
                              className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 pr-4 pl-12 text-gray-900 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            >
                              <option value="">Select timeline</option>
                              <option value="immediate">Immediately</option>
                              <option value="1month">Within 1 month</option>
                              <option value="3months">Within 3 months</option>
                              <option value="6months">Within 6 months</option>
                              <option value="exploring">Just exploring</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-gray-400">
                            Budget Range *
                          </label>
                          <div className="relative">
                            <CreditCard className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                            <select
                              value={formData.budget}
                              onChange={(e) =>
                                handleInputChange("budget", e.target.value)
                              }
                              className="w-full rounded-xl border border-gray-300 bg-gray-200 py-3 pr-4 pl-12 text-gray-900 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                            >
                              <option value="">Select budget</option>
                              <option value="<1000">
                                Less than $1,000/month
                              </option>
                              <option value="1000-5000">
                                $1,000 - $5,000/month
                              </option>
                              <option value="5000-10000">
                                $5,000 - $10,000/month
                              </option>
                              <option value="10000+">
                                More than $10,000/month
                              </option>
                              <option value="custom">
                                Need custom pricing
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm text-gray-400">
                          Additional Information (Optional)
                        </label>
                        <textarea
                          value={formData.additionalInfo}
                          onChange={(e) =>
                            handleInputChange("additionalInfo", e.target.value)
                          }
                          rows={4}
                          className="w-full resize-none rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-600 focus:outline-none dark:border-white/20 dark:bg-white/10 dark:text-white"
                          placeholder="Tell us more about your specific requirements or questions..."
                        />
                      </div>

                      {/* Value Props */}
                      <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white/5 p-4 dark:border-white/10">
                          <Shield className="mb-2 h-8 w-8 text-[#A47864]" />
                          <p className="text-sm text-gray-300">
                            Enterprise Security
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white/5 p-4 dark:border-white/10">
                          <Zap className="mb-2 h-8 w-8 text-[#D4735F]" />
                          <p className="text-sm text-gray-300">24/7 Support</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white/5 p-4 dark:border-white/10">
                          <Award className="mb-2 h-8 w-8 text-[#A47864]" />
                          <p className="text-sm text-gray-300">
                            30-Day Free Trial
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {submitStatus !== "success" && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white/5 px-8 py-6 dark:border-white/10">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 transition-all ${
                  currentStep === 1
                    ? "cursor-not-allowed text-gray-600 opacity-50 dark:text-gray-400"
                    : "text-gray-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-all ${
                      i < currentStep
                        ? "w-6 bg-gradient-to-r from-blue-600 to-purple-700"
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 transition-all ${
                    validateStep(currentStep)
                      ? "bg-gradient-to-r from-blue-600 to-purple-700 text-gray-900 hover:shadow-lg hover:shadow-purple-700/25 dark:text-white"
                      : "cursor-not-allowed bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!validateStep(totalSteps) || isSubmitting}
                  className={`flex items-center gap-2 rounded-xl px-8 py-3 transition-all ${
                    validateStep(totalSteps) && !isSubmitting
                      ? "bg-gradient-to-r from-blue-600 to-purple-700 text-gray-900 hover:shadow-lg hover:shadow-purple-700/25 dark:text-white"
                      : "cursor-not-allowed bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Request
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
