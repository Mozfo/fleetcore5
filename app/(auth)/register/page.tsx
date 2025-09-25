"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const formSchema = z
  .object({
    companyName: z.string().min(2, "Company name is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof formSchema>;
export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const { isLoaded, signUp } = useSignUp();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const watchEmail = watch("email");
  const watchCompany = watch("companyName");
  const onSubmit = async (data: FormData) => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");
    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        unsafeMetadata: {
          companyName: data.companyName,
        },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerificationPending(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        setError(clerkError.errors?.[0]?.message || "Something went wrong");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };
  if (verificationPending) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md"
      >
        <div className="rounded-3xl bg-white p-10 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-[#1C1917]">
            Check your email
          </h2>
          <p className="text-sm text-blue-600">
            We&apos;ve sent a verification code to {watchEmail}
          </p>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-3xl bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700">
            <span className="text-2xl font-bold text-white">F</span>
          </div>
        </motion.div>
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-[#1C1917]">
            Create your account
          </h1>
          <p className="text-sm text-blue-600">
            Join FleetCore Enterprise Platform
          </p>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label
              htmlFor="company"
              className="text-sm font-medium text-[#1C1917]"
            >
              Company Name
            </Label>
            <div className="relative">
              <Input
                id="company"
                placeholder="Acme Corp"
                className={`mt-1.5 h-11 border-[#E8DFD3] bg-[#FAF7F2]/50 pl-10 text-[#1C1917] placeholder:text-blue-600/50 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 ${watchCompany ? "border-blue-600 bg-white" : ""}`}
                {...register("companyName")}
                disabled={isLoading}
              />
              <Building2
                className={`absolute top-4 left-3 h-4 w-4 transition-colors ${watchCompany ? "text-blue-600" : "text-blue-600/40"}`}
              />
            </div>
            {errors.companyName && (
              <p className="mt-1.5 text-sm text-purple-700">
                {errors.companyName.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-[#1C1917]"
            >
              Work Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className={`mt-1.5 h-11 border-[#E8DFD3] bg-[#FAF7F2]/50 pl-10 text-[#1C1917] placeholder:text-blue-600/50 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 ${watchEmail ? "border-blue-600 bg-white" : ""}`}
                {...register("email")}
                disabled={isLoading}
              />
              <Mail
                className={`absolute top-4 left-3 h-4 w-4 transition-colors ${watchEmail ? "text-blue-600" : "text-blue-600/40"}`}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-sm text-purple-700">
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="password"
              className="text-sm font-medium text-[#1C1917]"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="mt-1.5 h-11 border-[#E8DFD3] bg-[#FAF7F2]/50 pr-10 text-[#1C1917] placeholder:text-blue-600/50 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20"
                {...register("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-4 right-3 text-blue-600 transition-colors hover:text-[#1C1917]"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-purple-700">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-[#1C1917]"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="mt-1.5 h-11 border-[#E8DFD3] bg-[#FAF7F2]/50 pr-10 text-[#1C1917] placeholder:text-blue-600/50 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-4 right-3 text-blue-600 transition-colors hover:text-[#1C1917]"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-purple-700">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          {error && (
            <div className="rounded-xl border border-purple-700/20 bg-purple-700/10 p-3 text-sm text-purple-700">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full transform rounded-xl bg-gray-900 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#2D4739] active:scale-[0.98] dark:bg-gray-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
        <div className="mt-6 border-t border-[#E8DFD3] pt-6">
          <p className="text-center text-sm text-blue-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#1C1917] hover:text-purple-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
