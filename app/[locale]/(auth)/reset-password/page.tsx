"use client";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = {
  password: string;
  confirmPassword: string;
};

function ResetPasswordForm() {
  const { t } = useTranslation("auth");
  const { localizedPath } = useLocalizedPath();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const formSchema = z
    .object({
      password: z
        .string()
        .min(8, t("resetPassword.errors.atLeast8"))
        .regex(/[A-Z]/, t("resetPassword.errors.oneUppercase"))
        .regex(/[a-z]/, t("resetPassword.errors.oneLowercase"))
        .regex(/[0-9]/, t("resetPassword.errors.oneNumber")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("resetPassword.errors.passwordMismatch"),
      path: ["confirmPassword"],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const watchPassword = watch("password");

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError(t("resetPassword.errors.invalidLink"));
    } else {
      setTokenValid(true);
    }
  }, [token, t]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    const { error: resetError } = await authClient.resetPassword({
      newPassword: data.password,
      token,
    });

    if (resetError) {
      const errorMessage = resetError.message?.includes("expired")
        ? t("resetPassword.linkExpired")
        : t("resetPassword.invalidOrExpired");
      setError(errorMessage);
      setTokenValid(false);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(localizedPath("login") + "?reset=success");
    }, 2000);
    setIsLoading(false);
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mb-2 text-lg font-medium text-[#1C1917]">
          {t("resetPassword.successTitle")}
        </h2>
        <p className="text-sm text-blue-600">
          {t("resetPassword.successRedirect")}
        </p>
      </motion.div>
    );
  }

  if (tokenValid === false) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mb-2 text-lg font-medium text-[#1C1917]">
          {t("resetPassword.invalidLinkTitle")}
        </h2>
        <p className="mb-6 text-sm text-blue-600">
          {t("resetPassword.invalidLinkMessage")}
        </p>
        <Button
          onClick={() => router.push(localizedPath("forgot-password"))}
          variant="outline"
          className="border-[#E8DFD3] text-[#1C1917] hover:bg-[#FAF7F2]"
        >
          {t("resetPassword.requestNewLink")}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-sm"
    >
      <h1 className="mb-2 text-xl font-medium text-[#1C1917]">
        {t("resetPassword.title")}
      </h1>
      <p className="mb-6 text-sm text-blue-600">
        {email
          ? t("resetPassword.subtitleWithEmail", { email })
          : t("resetPassword.subtitle")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("resetPassword.newPasswordPlaceholder")}
              className="h-10 border-[#E8DFD3] pr-10 focus:border-blue-600 focus:ring-0"
              {...register("password")}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-2.5 right-3 text-blue-600 hover:text-[#1C1917]"
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
            <p className="mt-1 text-xs text-purple-700">
              {errors.password.message}
            </p>
          )}

          {watchPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-1 w-1 rounded-full ${watchPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className="text-xs text-blue-600">
                  {t("resetPassword.requirements.chars")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-1 w-1 rounded-full ${/[A-Z]/.test(watchPassword) ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className="text-xs text-blue-600">
                  {t("resetPassword.requirements.uppercase")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-1 w-1 rounded-full ${/[a-z]/.test(watchPassword) ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className="text-xs text-blue-600">
                  {t("resetPassword.requirements.lowercase")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`h-1 w-1 rounded-full ${/[0-9]/.test(watchPassword) ? "bg-green-500" : "bg-gray-300"}`}
                />
                <span className="text-xs text-blue-600">
                  {t("resetPassword.requirements.number")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("resetPassword.confirmPasswordPlaceholder")}
              className="h-10 border-[#E8DFD3] pr-10 focus:border-blue-600 focus:ring-0"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-2.5 right-3 text-blue-600 hover:text-[#1C1917]"
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
            <p className="mt-1 text-xs text-purple-700">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-purple-700/10 p-2 text-xs text-purple-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full rounded-lg bg-gray-900 text-white hover:bg-[#2D4739] dark:bg-gray-700"
        >
          {isLoading
            ? `${t("resetPassword.resetting")}...`
            : t("resetPassword.resetPassword")}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-blue-600/60">
        {t("resetPassword.linkExpires")}
      </p>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
