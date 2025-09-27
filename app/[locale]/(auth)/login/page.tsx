"use client";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import {
  ArrowRight,
  Loader2,
  CheckCircle2,
  Scan,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  email: string;
  password: string;
};

function LoginForm() {
  const { t } = useTranslation("auth");
  const { localizedPath } = useLocalizedPath();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();

  const formSchema = z.object({
    email: z.string().email(t("login.errors.invalidEmail")),
    password: z.string().min(8, t("login.errors.passwordLength")),
  });

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setShowResetSuccess(true);
      setTimeout(() => setShowResetSuccess(false), 5000);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const watchEmail = watch("email");
  const watchPassword = watch("password");

  const onSubmit = async (data: FormData) => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === "complete") {
        setShowSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await setActive({ session: result.createdSessionId });
        router.push(localizedPath("dashboard"));
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const clerkError = err as { errors?: Array<{ message: string }> };
        setError(
          clerkError.errors?.[0]?.message ||
            t("login.errors.invalidCredentials")
        );
      } else {
        setError(t("login.errors.invalidCredentials"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-auto w-full max-w-md"
    >
      <div className="rounded-3xl bg-white p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:bg-gray-900">
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

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {t("login.title")}
          </h1>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {t("login.subtitle")}
          </p>
        </div>

        <AnimatePresence>
          {showResetSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:bg-green-900/20"
            >
              <p className="text-sm text-green-700">
                {t("login.resetSuccess")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              {t("login.email")}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              className={`mt-1.5 h-11 border-[#E8DFD3] bg-gray-50 text-gray-900 placeholder:text-blue-600 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 dark:bg-gray-800 dark:text-blue-400/50 dark:text-white ${watchEmail ? "border-blue-600 bg-white" : ""}`}
              {...register("email")}
              disabled={isLoading}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 text-sm text-purple-700"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                {t("login.password")}
              </Label>
              <Link
                href={localizedPath("forgot-password")}
                className="text-sm text-blue-600 transition-colors hover:text-purple-700 dark:text-blue-400"
              >
                {t("login.passwordForgot")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`h-11 border-[#E8DFD3] bg-gray-50 pr-10 text-gray-900 placeholder:text-blue-600 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 dark:bg-gray-800 dark:text-blue-400/50 dark:text-white ${watchPassword ? "border-blue-600 bg-white" : ""}`}
                {...register("password")}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3 text-blue-600 transition-colors hover:text-gray-900 dark:text-blue-400 dark:text-white"
                tabIndex={-1}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </motion.div>
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 text-sm text-purple-700"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-purple-700/20 bg-purple-700/10 p-3 text-sm text-purple-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full transform rounded-xl bg-gray-900 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#2D4739] active:scale-[0.98] dark:bg-gray-700"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("login.signIn")}...
                </motion.div>
              ) : showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  {t("login.welcomeBack")}
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center"
                >
                  {t("login.signIn")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E8DFD3] font-medium text-blue-600 transition-all duration-300 hover:border-blue-600 hover:bg-[#FAF7F2] dark:text-blue-400"
            disabled={isLoading}
          >
            <Scan className="h-4 w-4" />
            <span className="text-sm">{t("login.biometric")}</span>
          </button>
        </form>

        <div className="mt-8 border-t border-[#E8DFD3] pt-6">
          <p className="text-center text-xs text-blue-600 dark:text-blue-400/60">
            {t("login.adminContact")}
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-center"
      >
        <p className="text-xs text-blue-600 dark:text-blue-400/60">
          {t("login.compliance")}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
